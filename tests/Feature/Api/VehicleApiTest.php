<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Client;
use App\Models\Role;
use App\Models\User;
use App\Models\Vehicle;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VehicleApiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $receptionist;
    private Client $client;

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
            'first_name' => 'Carlos',
            'last_name' => 'Mendoza',
            'email' => 'carlos@example.com',
            'phone' => '+34600112233',
            'client_type' => 'Particular',
        ]);
    }

    /**
     * Listado paginado de vehículos.
     */
    public function test_can_list_vehicles(): void
    {
        Sanctum::actingAs($this->receptionist, ['*']);

        Vehicle::create([
            'client_id' => $this->client->id,
            'plate' => 'ABC1234',
            'brand' => 'Toyota',
            'model' => 'Corolla',
            'year' => 2021,
            'color' => 'Blanco',
            'current_mileage' => 45000,
        ]);

        $response = $this->getJson('/api/v1/vehicles');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data');
    }

    /**
     * Registro de vehículo exitoso con placa formateada en mayúsculas.
     */
    public function test_can_create_vehicle_with_valid_data(): void
    {
        Sanctum::actingAs($this->receptionist, ['*']);

        $payload = [
            'client_id' => $this->client->id,
            'plate' => 'xyz-9876',
            'brand' => 'Volkswagen',
            'model' => 'Golf',
            'year' => 2022,
            'color' => 'Azul Marino',
            'vin' => '1HGCR2F83HA000123',
            'current_mileage' => 25000,
        ];

        $response = $this->postJson('/api/v1/vehicles', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.plate', 'XYZ-9876')
            ->assertJsonPath('data.current_mileage', 25000);

        $this->assertDatabaseHas('vehicles', [
            'plate' => 'XYZ-9876',
            'brand' => 'Volkswagen',
            'deleted_at' => null,
        ]);
    }

    /**
     * Rechazo al intentar registrar placa duplicada (HTTP 422).
     */
    public function test_cannot_create_vehicle_with_duplicate_plate(): void
    {
        Sanctum::actingAs($this->receptionist, ['*']);

        Vehicle::create([
            'client_id' => $this->client->id,
            'plate' => 'DUP1234',
            'brand' => 'Ford',
            'model' => 'Focus',
            'year' => 2020,
            'current_mileage' => 30000,
        ]);

        $response = $this->postJson('/api/v1/vehicles', [
            'client_id' => $this->client->id,
            'plate' => 'dup1234',
            'brand' => 'Ford',
            'model' => 'Fiesta',
            'year' => 2019,
            'current_mileage' => 10000,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['plate']);
    }

    /**
     * Regla no regresiva de kilometraje: operador normal no puede reducir kilometraje (HTTP 422).
     */
    public function test_cannot_reduce_mileage_without_admin_override(): void
    {
        Sanctum::actingAs($this->receptionist, ['*']);

        $vehicle = Vehicle::create([
            'client_id' => $this->client->id,
            'plate' => 'KIL9999',
            'brand' => 'Honda',
            'model' => 'Civic',
            'year' => 2020,
            'current_mileage' => 80000,
        ]);

        $response = $this->putJson("/api/v1/vehicles/{$vehicle->id}", [
            'current_mileage' => 75000, // Menor que 80000
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors(['current_mileage']);
    }

    /**
     * Administrador puede corregir odómetro justificando el motivo (HTTP 200).
     */
    public function test_admin_can_override_mileage_with_justification(): void
    {
        Sanctum::actingAs($this->admin, ['*']);

        $vehicle = Vehicle::create([
            'client_id' => $this->client->id,
            'plate' => 'KIL8888',
            'brand' => 'Honda',
            'model' => 'Civic',
            'year' => 2020,
            'current_mileage' => 80000,
        ]);

        $response = $this->putJson("/api/v1/vehicles/{$vehicle->id}", [
            'current_mileage' => 75000,
            'override_mileage' => true,
            'override_reason' => 'Corrección por reemplazo de tablero de instrumentos averiado',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.current_mileage', 75000);

        $this->assertDatabaseHas('vehicles', [
            'id' => $vehicle->id,
            'current_mileage' => 75000,
        ]);
    }

    /**
     * Soft delete de vehículo preserva integridad referencial y permite auditoría.
     */
    public function test_admin_can_soft_delete_vehicle(): void
    {
        Sanctum::actingAs($this->admin, ['*']);

        $vehicle = Vehicle::create([
            'client_id' => $this->client->id,
            'plate' => 'DEL1234',
            'brand' => 'Nissan',
            'model' => 'Sentra',
            'year' => 2018,
            'current_mileage' => 110000,
        ]);

        $response = $this->deleteJson("/api/v1/vehicles/{$vehicle->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted('vehicles', ['id' => $vehicle->id]);
    }
}
