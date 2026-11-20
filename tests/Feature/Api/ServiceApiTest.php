<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Role;
use App\Models\Service;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ServiceApiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $receptionist;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);

        $this->admin = User::factory()->create();
        $this->admin->roles()->attach(Role::where('slug', 'admin')->first());

        $this->receptionist = User::factory()->create();
        $this->receptionist->roles()->attach(Role::where('slug', 'receptionist')->first());
    }

    /**
     * Listado del catálogo de servicios activos.
     */
    public function test_can_list_services(): void
    {
        Sanctum::actingAs($this->receptionist, ['*']);

        Service::create([
            'name' => 'Cambio de Aceite Sintético y Filtro',
            'category' => 'Mantenimiento Preventivo',
            'base_price' => 75.50,
            'status' => 'Activo',
        ]);

        $response = $this->getJson('/api/v1/services');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data');
    }

    /**
     * Administrador puede registrar un nuevo servicio con precio en DECIMAL(12,2).
     */
    public function test_admin_can_create_service(): void
    {
        Sanctum::actingAs($this->admin, ['*']);

        $payload = [
            'name' => 'Alineación y Balanceo Láser',
            'description' => 'Servicio completo de calibración por ejes computarizado',
            'category' => 'Suspensión y Dirección',
            'base_price' => 45.00,
            'status' => 'Activo',
        ];

        $response = $this->postJson('/api/v1/services', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Alineación y Balanceo Láser')
            ->assertJsonPath('data.base_price', 45.00);

        $this->assertDatabaseHas('services', [
            'name' => 'Alineación y Balanceo Láser',
            'base_price' => 45.00,
            'status' => 'Activo',
            'deleted_at' => null,
        ]);
    }

    /**
     * Rechazo de precio negativo (HTTP 422).
     */
    public function test_cannot_create_service_with_negative_price(): void
    {
        Sanctum::actingAs($this->admin, ['*']);

        $response = $this->postJson('/api/v1/services', [
            'name' => 'Servicio Inválido',
            'category' => 'General',
            'base_price' => -20.00,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['base_price']);
    }

    /**
     * Recepcionista no puede eliminar servicios del catálogo (HTTP 403).
     */
    public function test_receptionist_cannot_delete_service(): void
    {
        Sanctum::actingAs($this->receptionist, ['*']);

        $service = Service::create([
            'name' => 'Frenos Delanteros',
            'category' => 'Frenos',
            'base_price' => 120.00,
            'status' => 'Activo',
        ]);

        $response = $this->deleteJson("/api/v1/services/{$service->id}");

        $response->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    /**
     * Soft delete de servicio no borra registros físicos.
     */
    public function test_admin_can_soft_delete_service(): void
    {
        Sanctum::actingAs($this->admin, ['*']);

        $service = Service::create([
            'name' => 'Lavado de Motor',
            'category' => 'Estética',
            'base_price' => 30.00,
            'status' => 'Activo',
        ]);

        $response = $this->deleteJson("/api/v1/services/{$service->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted('services', ['id' => $service->id]);
    }
}
