<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\Client;
use App\Models\Mechanic;
use App\Models\Order;
use App\Models\OrderMechanic;
use App\Models\OrderService;
use App\Models\Role;
use App\Models\Service;
use App\Models\User;
use App\Models\Vehicle;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DatabaseIntegrityTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Prueba 1: Documento único por tipo de cliente (PRD CA-1.1.2).
     * Mismo número con el mismo tipo debe lanzar QueryException.
     */
    public function test_client_document_unique_by_type(): void
    {
        Client::create([
            'first_name' => 'Carlos',
            'last_name' => 'Mendoza',
            'document_type' => 'CC',
            'document_number' => '1020304050',
            'phone' => '3001234567',
        ]);

        $this->expectException(QueryException::class);

        Client::create([
            'first_name' => 'Juan',
            'last_name' => 'Gómez',
            'document_type' => 'CC',
            'document_number' => '1020304050',
            'phone' => '3109876543',
        ]);
    }

    /**
     * Prueba 2: Clientes con mismo número pero distinto tipo sí son válidos.
     * Ejemplo: CC 1020304050 vs CE 1020304050.
     */
    public function test_client_allows_same_number_for_different_document_types(): void
    {
        $c1 = Client::create([
            'first_name' => 'Carlos',
            'last_name' => 'Mendoza',
            'document_type' => 'CC',
            'document_number' => '1020304050',
            'phone' => '3001234567',
        ]);

        $c2 = Client::create([
            'first_name' => 'Hans',
            'last_name' => 'Mueller',
            'document_type' => 'CE',
            'document_number' => '1020304050',
            'phone' => '3157778899',
        ]);

        $this->assertDatabaseHas('clients', ['id' => $c1->id, 'document_type' => 'CC']);
        $this->assertDatabaseHas('clients', ['id' => $c2->id, 'document_type' => 'CE']);
    }

    /**
     * Prueba 3: Placa única vehicular (PRD CA-2.1.1, PT-002).
     */
    public function test_vehicle_plate_must_be_globally_unique(): void
    {
        $client = Client::create([
            'first_name' => 'Laura',
            'last_name' => 'Ríos',
            'document_type' => 'CC',
            'document_number' => '987654321',
            'phone' => '3205556677',
        ]);

        Vehicle::create([
            'client_id' => $client->id,
            'plate' => 'ABC123',
            'brand' => 'Mazda',
            'model' => '3',
            'year' => 2022,
            'current_mileage' => 45000,
        ]);

        $this->expectException(QueryException::class);

        Vehicle::create([
            'client_id' => $client->id,
            'plate' => 'ABC123',
            'brand' => 'Chevrolet',
            'model' => 'Onix',
            'year' => 2023,
            'current_mileage' => 12000,
        ]);
    }

    /**
     * Prueba 4: Documento de identidad único por mecánico (PRD CA-3.1.1).
     */
    public function test_mechanic_document_must_be_unique(): void
    {
        Mechanic::create([
            'first_name' => 'Andrés',
            'last_name' => 'Salazar',
            'document_number' => '71234567',
            'phone' => '3114445566',
            'specialty' => 'Motores',
        ]);

        $this->expectException(QueryException::class);

        Mechanic::create([
            'first_name' => 'Felipe',
            'last_name' => 'Díaz',
            'document_number' => '71234567',
            'phone' => '3128889900',
            'specialty' => 'Frenos',
        ]);
    }

    /**
     * Prueba 5: Numeración de orden secuencial y única (PRD RF-5.1, PT-011).
     */
    public function test_order_number_must_be_unique(): void
    {
        $client = Client::create([
            'first_name' => 'Martín',
            'last_name' => 'Ochoa',
            'document_type' => 'CC',
            'document_number' => '80123456',
            'phone' => '3007778899',
        ]);

        $vehicle = Vehicle::create([
            'client_id' => $client->id,
            'plate' => 'XYZ789',
            'brand' => 'Renault',
            'model' => 'Duster',
            'year' => 2021,
            'current_mileage' => 60000,
        ]);

        Order::create([
            'order_number' => 'ORD-2026-0001',
            'vehicle_id' => $vehicle->id,
            'client_id' => $client->id,
            'entry_mileage' => 60000,
            'reported_issue' => 'Ruido en suspensión delantera',
            'status' => OrderStatus::PENDIENTE,
        ]);

        $this->expectException(QueryException::class);

        Order::create([
            'order_number' => 'ORD-2026-0001',
            'vehicle_id' => $vehicle->id,
            'client_id' => $client->id,
            'entry_mileage' => 60000,
            'reported_issue' => 'Frenos largos',
            'status' => OrderStatus::PENDIENTE,
        ]);
    }

    /**
     * Prueba 6: Prevención de duplicidad de mecánicos en una misma orden (PRD CA-3.2.2, PT-005, TRD Sección 2).
     */
    public function test_order_cannot_assign_same_mechanic_twice(): void
    {
        $client = Client::create([
            'first_name' => 'Diana',
            'last_name' => 'Pérez',
            'document_type' => 'CC',
            'document_number' => '52123456',
            'phone' => '3012223344',
        ]);

        $vehicle = Vehicle::create([
            'client_id' => $client->id,
            'plate' => 'KLM456',
            'brand' => 'Toyota',
            'model' => 'Corolla',
            'year' => 2020,
            'current_mileage' => 38000,
        ]);

        $mechanic = Mechanic::create([
            'first_name' => 'Rodrigo',
            'last_name' => 'Vargas',
            'document_number' => '93123456',
            'phone' => '3146667788',
        ]);

        $order = Order::create([
            'order_number' => 'ORD-2026-0002',
            'vehicle_id' => $vehicle->id,
            'client_id' => $client->id,
            'entry_mileage' => 38000,
            'reported_issue' => 'Cambio de aceite y filtros',
            'status' => OrderStatus::PENDIENTE,
        ]);

        // Primera asignación exitosa
        OrderMechanic::create([
            'order_id' => $order->id,
            'mechanic_id' => $mechanic->id,
        ]);

        $this->expectException(QueryException::class);

        // Segunda asignación idéntica debe ser rechazada por UNIQUE(order_id, mechanic_id)
        OrderMechanic::create([
            'order_id' => $order->id,
            'mechanic_id' => $mechanic->id,
        ]);
    }

    /**
     * Prueba 7: Soft Deletes en clientes, vehículos y servicios (TRD Sección 2).
     */
    public function test_soft_deletes_on_clients_vehicles_and_services(): void
    {
        $client = Client::create([
            'first_name' => 'Elena',
            'last_name' => 'Suárez',
            'document_type' => 'CC',
            'document_number' => '63123456',
            'phone' => '3189990011',
        ]);

        $vehicle = Vehicle::create([
            'client_id' => $client->id,
            'plate' => 'QWE123',
            'brand' => 'Nissan',
            'model' => 'Versa',
            'year' => 2019,
            'current_mileage' => 75000,
        ]);

        $service = Service::create([
            'name' => 'Alineación y Balanceo',
            'base_price' => '85000.00',
        ]);

        // Eliminación lógica
        $client->delete();
        $vehicle->delete();
        $service->delete();

        // No aparecen en consultas estándar
        $this->assertNull(Client::find($client->id));
        $this->assertNull(Vehicle::find($vehicle->id));
        $this->assertNull(Service::find($service->id));

        // Pero se conservan intactos en la base de datos (con deleted_at)
        $this->assertNotNull(Client::withTrashed()->find($client->id));
        $this->assertNotNull(Vehicle::withTrashed()->find($vehicle->id));
        $this->assertNotNull(Service::withTrashed()->find($service->id));
    }

    /**
     * Prueba 8: Snapshot inmutable de precio de servicio en órdenes (PRD RF-4.2, PT-007).
     * Modificar el catálogo jamás altera órdenes existentes.
     */
    public function test_service_price_snapshot_preserved_in_order_services(): void
    {
        $service = Service::create([
            'name' => 'Cambio de Pastillas de Freno',
            'base_price' => '120000.00',
        ]);

        $client = Client::create([
            'first_name' => 'Mauricio',
            'last_name' => 'Torres',
            'document_type' => 'CC',
            'document_number' => '19123456',
            'phone' => '3161112233',
        ]);

        $vehicle = Vehicle::create([
            'client_id' => $client->id,
            'plate' => 'MNO321',
            'brand' => 'Ford',
            'model' => 'Fiesta',
            'year' => 2018,
            'current_mileage' => 92000,
        ]);

        $order = Order::create([
            'order_number' => 'ORD-2026-0003',
            'vehicle_id' => $vehicle->id,
            'client_id' => $client->id,
            'entry_mileage' => 92000,
            'reported_issue' => 'Pastillas desgastadas',
            'status' => OrderStatus::PENDIENTE,
        ]);

        // Se carga el servicio congelando su precio unitario actual
        $orderService = OrderService::create([
            'order_id' => $order->id,
            'service_id' => $service->id,
            'service_name' => $service->name,
            'unit_price' => $service->base_price,
            'quantity' => 2,
            'subtotal' => '240000.00',
        ]);

        // Luego se actualiza el catálogo con tarifa incrementada
        $service->update([
            'name' => 'Pastillas de Freno Premium',
            'base_price' => '180000.00',
        ]);

        // Verificamos que la línea de la orden permanece inmutable
        $orderServiceFresh = OrderService::find($orderService->id);
        $this->assertSame('120000.00', $orderServiceFresh->unit_price);
        $this->assertSame('240000.00', $orderServiceFresh->subtotal);
        $this->assertSame('Cambio de Pastillas de Freno', $orderServiceFresh->service_name);
    }

    /**
     * Prueba 9: Seeders crean los 4 roles requeridos y el usuario administrador inicial.
     * Credenciales leídas de variables de entorno (TRD Sección 2).
     */
    public function test_seeders_create_roles_and_admin_user_from_environment(): void
    {
        // Configuramos variables de entorno dinámicas para la prueba
        putenv('ADMIN_NAME=Admin Automatizado');
        putenv('ADMIN_EMAIL=admin.qa@taller.local');
        putenv('ADMIN_PASSWORD=PasswordDinamico2026!*');

        // Ejecución del Seeder maestro
        $this->seed(DatabaseSeeder::class);

        // Verificamos los 4 roles obligatorios
        $this->assertDatabaseHas('roles', ['name' => 'Administrador', 'slug' => 'admin']);
        $this->assertDatabaseHas('roles', ['name' => 'Recepcionista', 'slug' => 'receptionist']);
        $this->assertDatabaseHas('roles', ['name' => 'Mecánico', 'slug' => 'mechanic']);
        $this->assertDatabaseHas('roles', ['name' => 'Cliente Final', 'slug' => 'client']);
        $this->assertCount(4, Role::all());

        // Verificamos el usuario administrador inicial
        $admin = User::query()->where('email', 'admin.qa@taller.local')->first();
        $this->assertNotNull($admin);
        $this->assertSame('Admin Automatizado', $admin->name);
        $this->assertTrue(Hash::check('PasswordDinamico2026!*', $admin->password));

        // Verificamos que el rol Administrador está asociado en la tabla pivote role_user
        $this->assertTrue($admin->isAdmin());
        $this->assertTrue($admin->roles->contains('slug', 'admin'));
    }
}
