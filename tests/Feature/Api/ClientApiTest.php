<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Client;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $receptionistUser;
    protected User $mechanicUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);

        $this->adminUser = User::whereHas('roles', fn ($q) => $q->where('slug', 'admin'))->first();

        // Crea usuario Recepcionista
        $this->receptionistUser = User::factory()->create(['status' => 'Activo']);
        $receptionistRole = Role::where('slug', 'receptionist')->first();
        $this->receptionistUser->roles()->attach($receptionistRole);

        // Crea usuario Mecánico
        $this->mechanicUser = User::factory()->create(['status' => 'Activo']);
        $mechanicRole = Role::where('slug', 'mechanic')->first();
        $this->mechanicUser->roles()->attach($mechanicRole);
    }

    /**
     * Prueba listado paginado de clientes (HTTP 200).
     */
    public function test_can_list_clients_paginated(): void
    {
        Client::create([
            'first_name' => 'Mario',
            'last_name' => 'Bros',
            'document_type' => 'CC',
            'document_number' => '11223344',
            'phone' => '3001112233',
        ]);

        $response = $this->actingAs($this->receptionistUser, 'sanctum')
            ->getJson('/api/v1/clients');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data',
                'meta' => ['current_page', 'total', 'per_page'],
            ]);
    }

    /**
     * Prueba creación exitosa de cliente (HTTP 201).
     */
    public function test_receptionist_can_create_client(): void
    {
        $payload = [
            'first_name' => 'Alejandro',
            'last_name' => 'Morales',
            'document_type' => 'CC',
            'document_number' => '987654321',
            'phone' => '3157778899',
            'email' => 'alejandro@ejemplo.com',
            'address' => 'Carrera 15 # 45-67',
        ];

        $response = $this->actingAs($this->receptionistUser, 'sanctum')
            ->postJson('/api/v1/clients', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'first_name' => 'Alejandro',
                    'document_number' => '987654321',
                ],
            ]);

        $this->assertDatabaseHas('clients', ['document_number' => '987654321']);
    }

    /**
     * Prueba rechazo de cliente con documento duplicado (HTTP 422, PT-001).
     */
    public function test_rejects_duplicate_client_document(): void
    {
        Client::create([
            'first_name' => 'Existente',
            'last_name' => 'Primero',
            'document_type' => 'CC',
            'document_number' => '555666777',
            'phone' => '3000000000',
        ]);

        $payload = [
            'first_name' => 'Nuevo',
            'last_name' => 'Segundo',
            'document_type' => 'CC',
            'document_number' => '555666777', // Mismo documento
            'phone' => '3111111111',
        ];

        $response = $this->actingAs($this->receptionistUser, 'sanctum')
            ->postJson('/api/v1/clients', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['document_number']);
    }

    /**
     * Prueba RBAC: El rol Mecánico no puede registrar clientes (HTTP 403, PT-017).
     */
    public function test_mechanic_cannot_create_client(): void
    {
        $payload = [
            'first_name' => 'Intento',
            'last_name' => 'Fallido',
            'document_type' => 'CC',
            'document_number' => '12344321',
            'phone' => '3200000000',
        ];

        $response = $this->actingAs($this->mechanicUser, 'sanctum')
            ->postJson('/api/v1/clients', $payload);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Acceso no autorizado: No cuenta con los privilegios requeridos.',
            ]);
    }

    /**
     * Prueba actualización y soft delete de cliente.
     */
    public function test_admin_can_update_and_soft_delete_client(): void
    {
        $client = Client::create([
            'first_name' => 'Laura',
            'last_name' => 'Gómez',
            'document_type' => 'CE',
            'document_number' => '444555666',
            'phone' => '3012223344',
        ]);

        // Actualizar (HTTP 200)
        $updateResp = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson("/api/v1/clients/{$client->id}", [
                'first_name' => 'Laura Sofía',
                'phone' => '3019998877',
            ]);

        $updateResp->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'first_name' => 'Laura Sofía',
                    'phone' => '3019998877',
                ],
            ]);

        // Soft Delete (HTTP 200)
        $deleteResp = $this->actingAs($this->adminUser, 'sanctum')
            ->deleteJson("/api/v1/clients/{$client->id}");

        $deleteResp->assertStatus(200);

        $this->assertSoftDeleted('clients', ['id' => $client->id]);
    }
}
