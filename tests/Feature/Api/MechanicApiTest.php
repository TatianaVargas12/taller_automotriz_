<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Mechanic;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MechanicApiTest extends TestCase
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
     * Recepcionista puede consultar listado de mecánicos.
     */
    public function test_receptionist_can_list_mechanics(): void
    {
        Sanctum::actingAs($this->receptionist, ['*']);

        Mechanic::create([
            'document_type' => 'DNI',
            'document_number' => '44556677B',
            'name' => 'Luis Méndez',
            'specialty' => 'Mecánica Rápida',
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/v1/mechanics');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data');
    }

    /**
     * Administrador puede registrar nuevo mecánico.
     */
    public function test_admin_can_create_mechanic(): void
    {
        Sanctum::actingAs($this->admin, ['*']);

        $payload = [
            'document_type' => 'DNI',
            'document_number' => '99887766K',
            'name' => 'Pedro Sánchez',
            'phone' => '+34611223344',
            'specialty' => 'Electricidad y Diagnóstico',
            'is_active' => true,
        ];

        $response = $this->postJson('/api/v1/mechanics', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Pedro Sánchez')
            ->assertJsonPath('data.specialty', 'Electricidad y Diagnóstico');

        $this->assertDatabaseHas('mechanics', [
            'document_number' => '99887766K',
            'name' => 'Pedro Sánchez',
        ]);
    }

    /**
     * Recepcionista no tiene permiso para crear mecánicos (HTTP 403).
     */
    public function test_receptionist_cannot_create_mechanic(): void
    {
        Sanctum::actingAs($this->receptionist, ['*']);

        $response = $this->postJson('/api/v1/mechanics', [
            'document_type' => 'DNI',
            'document_number' => '11223344X',
            'name' => 'Mecánico No Autorizado',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    /**
     * Documento de mecánico debe ser único (HTTP 422).
     */
    public function test_cannot_create_mechanic_with_duplicate_document(): void
    {
        Sanctum::actingAs($this->admin, ['*']);

        Mechanic::create([
            'document_type' => 'DNI',
            'document_number' => '55667788P',
            'name' => 'Mario Rossi',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/v1/mechanics', [
            'document_type' => 'DNI',
            'document_number' => '55667788P',
            'name' => 'Mario Rossi Clon',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['document_number']);
    }

    /**
     * Administrador puede alternar estado activo/inactivo de un mecánico.
     */
    public function test_admin_can_toggle_mechanic_status(): void
    {
        Sanctum::actingAs($this->admin, ['*']);

        $mechanic = Mechanic::create([
            'document_type' => 'DNI',
            'document_number' => '77889900L',
            'name' => 'Antonio López',
            'is_active' => true,
        ]);

        $response = $this->patchJson("/api/v1/mechanics/{$mechanic->id}/status", [
            'is_active' => false,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.is_active', false);

        $this->assertDatabaseHas('mechanics', [
            'id' => $mechanic->id,
            'is_active' => false,
        ]);
    }
}
