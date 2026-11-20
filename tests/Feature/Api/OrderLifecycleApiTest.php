<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Enums\OrderStatus;
use App\Models\Client;
use App\Models\Mechanic;
use App\Models\Order;
use App\Models\Role;
use App\Models\Service;
use App\Models\User;
use App\Models\Vehicle;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrderLifecycleApiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $receptionist;
    private Client $client;
    private Vehicle $vehicle;
    private Mechanic $activeMechanic;
    private Mechanic $inactiveMechanic;
    private Service $activeService;
    private Service $inactiveService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);

        $this->admin = User::factory()->create();
        $this->admin->roles()->attach(Role::where('slug', 'admin')->first());

        $this->receptionist = User::factory()->create();
        $this->receptionist->roles()->attach(Role::where('slug', 'receptionist')->first());

        $this->client = Client::create([
            'document_type' => 'DNI',
            'document_number' => '12345678A',
            'first_name' => 'Mario',
            'last_name' => 'Bros',
            'email' => 'mario@example.com',
            'phone' => '+34600000001',
            'client_type' => 'Particular',
        ]);

        $this->vehicle = Vehicle::create([
            'client_id' => $this->client->id,
            'plate' => 'ORD-1234',
            'brand' => 'Seat',
            'model' => 'Ibiza',
            'year' => 2020,
            'current_mileage' => 50000,
        ]);

        $this->activeMechanic = Mechanic::create([
            'document_type' => 'DNI',
            'document_number' => '11111111M',
            'name' => 'Mecánico Activo',
            'specialty' => 'Motor',
            'is_active' => true,
        ]);

        $this->inactiveMechanic = Mechanic::create([
            'document_type' => 'DNI',
            'document_number' => '22222222M',
            'name' => 'Mecánico Inactivo',
            'specialty' => 'Pintura',
            'is_active' => false,
        ]);

        $this->activeService = Service::create([
            'name' => 'Cambio de Aceite',
            'category' => 'Mantenimiento',
            'base_price' => 80.00,
            'status' => 'Activo',
        ]);

        $this->inactiveService = Service::create([
            'name' => 'Servicio Obsoleto',
            'category' => 'Antiguo',
            'base_price' => 20.00,
            'status' => 'Inactivo',
        ]);
    }

    /**
     * PT-001 y PT-002: Apertura de orden genera número secuencial único ORD-YYYY-XXXX y estado inicial PENDIENTE.
     */
    public function test_can_create_order_with_sequential_number_and_pending_status(): void
    {
        Sanctum::actingAs($this->receptionist, ['*']);

        $payload = [
            'vehicle_id' => $this->vehicle->id,
            'entry_mileage' => 50500,
            'client_notes' => 'Ruido en tren delantero al girar a baja velocidad.',
            'estimated_delivery_date' => now()->addDays(2)->format('Y-m-d H:i:s'),
        ];

        $response = $this->postJson('/api/v1/orders', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', OrderStatus::PENDIENTE->value)
            ->assertJsonPath('data.entry_mileage', 50500);

        $orderNumber = $response->json('data.order_number');
        $currentYear = date('Y');
        $this->assertMatchesRegularExpression("/^ORD-{$currentYear}-\\d{4}$/", $orderNumber);

        // Verifica que se creó la bitácora inicial de estado
        $this->assertDatabaseHas('order_status_history', [
            'from_status' => null,
            'to_status' => OrderStatus::PENDIENTE->value,
            'changed_by' => $this->receptionist->id,
        ]);
    }

    /**
     * PT-003: Rechazo al abrir orden con kilometraje inferior al último registrado en el vehículo (HTTP 422).
     */
    public function test_cannot_create_order_with_mileage_lower_than_vehicle_current_mileage(): void
    {
        Sanctum::actingAs($this->receptionist, ['*']);

        $payload = [
            'vehicle_id' => $this->vehicle->id,
            'entry_mileage' => 45000, // Vehículo está en 50000
            'client_notes' => 'Intento de registro con odómetro menor.',
        ];

        $response = $this->postJson('/api/v1/orders', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['entry_mileage']);
    }

    /**
     * PT-007: Guardado de servicio como snapshot de precio; modificación posterior de catálogo no altera la orden.
     */
    public function test_can_add_service_to_order_and_snapshot_unit_price(): void
    {
        Sanctum::actingAs($this->receptionist, ['*']);

        $order = Order::create([
            'order_number' => 'ORD-2026-9001',
            'client_id' => $this->client->id,
            'vehicle_id' => $this->vehicle->id,
            'receptionist_id' => $this->receptionist->id,
            'entry_mileage' => 50000,
            'status' => OrderStatus::PENDIENTE,
        ]);

        $response = $this->postJson("/api/v1/orders/{$order->id}/services", [
            'service_id' => $this->activeService->id,
            'quantity' => 2,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.unit_price', 80.00)
            ->assertJsonPath('data.subtotal', 160.00);

        // Cambiar precio en catálogo
        $this->activeService->update(['base_price' => 150.00]);

        // Verificar que la línea de la orden sigue conservando 80.00
        $this->assertDatabaseHas('order_services', [
            'order_id' => $order->id,
            'service_id' => $this->activeService->id,
            'unit_price' => 80.00,
            'subtotal' => 160.00,
        ]);
    }

    /**
     * PT-006: Rechazo al agregar servicio inactivo a la orden (HTTP 422).
     */
    public function test_cannot_add_inactive_service_to_order(): void
    {
        Sanctum::actingAs($this->receptionist, ['*']);

        $order = Order::create([
            'order_number' => 'ORD-2026-9002',
            'client_id' => $this->client->id,
            'vehicle_id' => $this->vehicle->id,
            'receptionist_id' => $this->receptionist->id,
            'entry_mileage' => 50000,
            'status' => OrderStatus::PENDIENTE,
        ]);

        $response = $this->postJson("/api/v1/orders/{$order->id}/services", [
            'service_id' => $this->inactiveService->id,
            'quantity' => 1,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['service_id']);
    }

    /**
     * Asignación de mecánico activo a la orden exitosa.
     */
    public function test_can_assign_active_mechanic_to_order(): void
    {
        Sanctum::actingAs($this->receptionist, ['*']);

        $order = Order::create([
            'order_number' => 'ORD-2026-9003',
            'client_id' => $this->client->id,
            'vehicle_id' => $this->vehicle->id,
            'receptionist_id' => $this->receptionist->id,
            'entry_mileage' => 50000,
            'status' => OrderStatus::PENDIENTE,
        ]);

        $response = $this->postJson("/api/v1/orders/{$order->id}/mechanics", [
            'mechanic_id' => $this->activeMechanic->id,
            'role_description' => 'Mecánico Principal',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('order_mechanic', [
            'order_id' => $order->id,
            'mechanic_id' => $this->activeMechanic->id,
        ]);
    }

    /**
     * PT-004: Rechazo al asignar mecánico inactivo (HTTP 422).
     */
    public function test_cannot_assign_inactive_mechanic_to_order(): void
    {
        Sanctum::actingAs($this->receptionist, ['*']);

        $order = Order::create([
            'order_number' => 'ORD-2026-9004',
            'client_id' => $this->client->id,
            'vehicle_id' => $this->vehicle->id,
            'receptionist_id' => $this->receptionist->id,
            'entry_mileage' => 50000,
            'status' => OrderStatus::PENDIENTE,
        ]);

        $response = $this->postJson("/api/v1/orders/{$order->id}/mechanics", [
            'mechanic_id' => $this->inactiveMechanic->id,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['mechanic_id']);
    }

    /**
     * PT-005: Rechazo al asignar mecánico duplicado (HTTP 422).
     */
    public function test_cannot_assign_duplicate_mechanic_to_order(): void
    {
        Sanctum::actingAs($this->receptionist, ['*']);

        $order = Order::create([
            'order_number' => 'ORD-2026-9005',
            'client_id' => $this->client->id,
            'vehicle_id' => $this->vehicle->id,
            'receptionist_id' => $this->receptionist->id,
            'entry_mileage' => 50000,
            'status' => OrderStatus::PENDIENTE,
        ]);

        $order->mechanics()->attach($this->activeMechanic->id, ['assigned_at' => now()]);

        $response = $this->postJson("/api/v1/orders/{$order->id}/mechanics", [
            'mechanic_id' => $this->activeMechanic->id,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['mechanic_id']);
    }

    /**
     * CA-5.2.1: Precondición para EN_REPARACION rechaza con HTTP 422 si falta servicio o mecánico activo.
     */
    public function test_cannot_transition_to_en_reparacion_without_services_and_mechanic(): void
    {
        Sanctum::actingAs($this->receptionist, ['*']);

        $order = Order::create([
            'order_number' => 'ORD-2026-9006',
            'client_id' => $this->client->id,
            'vehicle_id' => $this->vehicle->id,
            'receptionist_id' => $this->receptionist->id,
            'entry_mileage' => 50000,
            'status' => OrderStatus::EN_DIAGNOSTICO,
        ]);

        // Sin servicios ni mecánicos
        $response = $this->postJson("/api/v1/orders/{$order->id}/transition", [
            'to_status' => OrderStatus::EN_REPARACION->value,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors(['services', 'mechanics']);
    }

    /**
     * Transición a EN_REPARACION permitida al cumplir con al menos 1 servicio y 1 mecánico activo.
     */
    public function test_can_transition_to_en_reparacion_with_service_and_mechanic(): void
    {
        Sanctum::actingAs($this->receptionist, ['*']);

        $order = Order::create([
            'order_number' => 'ORD-2026-9007',
            'client_id' => $this->client->id,
            'vehicle_id' => $this->vehicle->id,
            'receptionist_id' => $this->receptionist->id,
            'entry_mileage' => 50000,
            'status' => OrderStatus::EN_DIAGNOSTICO,
        ]);

        $order->services()->attach($this->activeService->id, [
            'quantity' => 1,
            'unit_price' => 80.00,
            'subtotal' => 80.00,
        ]);
        $order->mechanics()->attach($this->activeMechanic->id, ['assigned_at' => now()]);

        $response = $this->postJson("/api/v1/orders/{$order->id}/transition", [
            'to_status' => OrderStatus::EN_REPARACION->value,
            'reason' => 'Diagnóstico completado y aprobado por cliente.',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', OrderStatus::EN_REPARACION->value);

        $this->assertEquals(OrderStatus::EN_REPARACION, $order->fresh()->status);
    }

    /**
     * PT-008: Intento de entrega desde estado distinto a FINALIZADA debe ser rechazado estrictamente con HTTP 422.
     */
    public function test_cannot_deliver_order_from_state_other_than_finalizada(): void
    {
        Sanctum::actingAs($this->receptionist, ['*']);

        $order = Order::create([
            'order_number' => 'ORD-2026-9008',
            'client_id' => $this->client->id,
            'vehicle_id' => $this->vehicle->id,
            'receptionist_id' => $this->receptionist->id,
            'entry_mileage' => 50000,
            'status' => OrderStatus::EN_REPARACION,
        ]);

        $response = $this->postJson("/api/v1/orders/{$order->id}/deliver", [
            'notes' => 'Intento de entrega prematura',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors(['status']);
    }

    /**
     * Entrega exitosa solo desde FINALIZADA: cambia estado a ENTREGADA y registra delivered_at.
     */
    public function test_can_deliver_order_from_finalizada_and_locks_order(): void
    {
        Sanctum::actingAs($this->receptionist, ['*']);

        $order = Order::create([
            'order_number' => 'ORD-2026-9009',
            'client_id' => $this->client->id,
            'vehicle_id' => $this->vehicle->id,
            'receptionist_id' => $this->receptionist->id,
            'entry_mileage' => 50000,
            'status' => OrderStatus::FINALIZADA,
        ]);

        $response = $this->postJson("/api/v1/orders/{$order->id}/deliver", [
            'notes' => 'Vehículo entregado a satisfacción del cliente.',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', OrderStatus::ENTREGADA->value);

        $fresh = $order->fresh();
        $this->assertEquals(OrderStatus::ENTREGADA, $fresh->status);
        $this->assertNotNull($fresh->delivered_at);
    }

    /**
     * PT-009: Inmutabilidad de orden entregada; cualquier intento de edición es rechazado estrictamente con HTTP 422.
     */
    public function test_cannot_modify_delivered_order(): void
    {
        Sanctum::actingAs($this->receptionist, ['*']);

        $order = Order::create([
            'order_number' => 'ORD-2026-9010',
            'client_id' => $this->client->id,
            'vehicle_id' => $this->vehicle->id,
            'receptionist_id' => $this->receptionist->id,
            'entry_mileage' => 50000,
            'status' => OrderStatus::ENTREGADA,
            'delivered_at' => now(),
        ]);

        // Intento de actualizar notas
        $response1 = $this->putJson("/api/v1/orders/{$order->id}", [
            'client_notes' => 'Modificación posterior indebida.',
        ]);
        $response1->assertStatus(422)
            ->assertJsonPath('success', false);

        // Intento de agregar servicio
        $response2 = $this->postJson("/api/v1/orders/{$order->id}/services", [
            'service_id' => $this->activeService->id,
            'quantity' => 1,
        ]);
        $response2->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    /**
     * PT-010: Cancelación requiere motivo obligatorio y solo es válida antes de FINALIZADA.
     */
    public function test_cancellation_rules_requires_reason_and_fails_if_already_finalizada(): void
    {
        Sanctum::actingAs($this->receptionist, ['*']);

        $orderPending = Order::create([
            'order_number' => 'ORD-2026-9011',
            'client_id' => $this->client->id,
            'vehicle_id' => $this->vehicle->id,
            'receptionist_id' => $this->receptionist->id,
            'entry_mileage' => 50000,
            'status' => OrderStatus::PENDIENTE,
        ]);

        // 1. Falla sin motivo (422)
        $responseNoReason = $this->postJson("/api/v1/orders/{$orderPending->id}/cancel", [
            'reason' => '',
        ]);
        $responseNoReason->assertStatus(422)
            ->assertJsonValidationErrors(['reason']);

        // 2. Éxito con motivo desde PENDIENTE
        $responseCancelOk = $this->postJson("/api/v1/orders/{$orderPending->id}/cancel", [
            'reason' => 'Cliente cancela cita por viaje urgente.',
        ]);
        $responseCancelOk->assertStatus(200)
            ->assertJsonPath('data.status', OrderStatus::CANCELADA->value);

        // 3. Falla si la orden ya está FINALIZADA
        $orderFinalizada = Order::create([
            'order_number' => 'ORD-2026-9012',
            'client_id' => $this->client->id,
            'vehicle_id' => $this->vehicle->id,
            'receptionist_id' => $this->receptionist->id,
            'entry_mileage' => 50000,
            'status' => OrderStatus::FINALIZADA,
        ]);

        $responseCancelFin = $this->postJson("/api/v1/orders/{$orderFinalizada->id}/cancel", [
            'reason' => 'Intento de cancelar orden ya terminada.',
        ]);
        $responseCancelFin->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }
}
