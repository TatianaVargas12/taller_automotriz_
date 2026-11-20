<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Client;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RbacApiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $receptionist;
    private User $mechanic;
    private User $clientUser;
    private Client $client;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);

        $this->admin = User::factory()->create();
        $this->admin->roles()->attach(Role::where('slug', 'admin')->first());

        $this->receptionist = User::factory()->create();
        $this->receptionist->roles()->attach(Role::where('slug', 'receptionist')->first());

        $this->mechanic = User::factory()->create();
        $this->mechanic->roles()->attach(Role::where('slug', 'mechanic')->first());

        $this->clientUser = User::factory()->create([
            'email' => 'cliente.propio@autotaller.pro',
        ]);
        $this->clientUser->roles()->attach(Role::where('slug', 'client')->first());

        $this->client = Client::create([
            'first_name' => 'Ana',
            'last_name' => 'García',
            'document_type' => 'CC',
            'document_number' => '10203040',
            'phone' => '3001234567',
            'email' => 'cliente.propio@autotaller.pro',
            'status' => 'active',
        ]);
    }

    /**
     * Solicitud a ruta protegida sin autenticación retorna HTTP 401 Unauthorized.
     */
    public function test_unauthenticated_request_returns_401(): void
    {
        $response = $this->getJson('/api/v1/clients');

        $response->assertStatus(401)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'No autenticado.');
    }

    /**
     * Mecánico intentando acceder a rutas exclusivas de Administrador retorna HTTP 403 Forbidden y audita el evento.
     */
    public function test_mechanic_attempting_to_access_admin_route_returns_403_and_audits(): void
    {
        Sanctum::actingAs($this->mechanic, ['*']);

        // Intento de dar de alta un mecánico (solo admin)
        $response = $this->postJson('/api/v1/mechanics', [
            'first_name' => 'Intento',
            'last_name' => 'NoAutorizado',
            'document_type' => 'CC',
            'document_number' => '99887766',
            'specialty' => 'Mecánica General',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'No tiene permisos para realizar esta acción.');

        // Verifica que se generó un log de auditoría por acceso denegado
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $this->mechanic->id,
            'action' => 'access_denied',
        ]);
    }

    /**
     * Recepcionista no puede eliminar físicamente ni por soft-delete servicios del catálogo (HTTP 403 Forbidden).
     */
    public function test_receptionist_cannot_delete_service_from_catalog(): void
    {
        Sanctum::actingAs($this->receptionist, ['*']);

        $response = $this->deleteJson('/api/v1/services/1');

        $response->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    /**
     * Cliente final no puede acceder a endpoints de gestión de mecánicos (HTTP 403 Forbidden).
     */
    public function test_client_cannot_access_mechanics_management(): void
    {
        Sanctum::actingAs($this->clientUser, ['*']);

        $response = $this->getJson('/api/v1/mechanics');

        $response->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    /**
     * Cliente final no puede consultar los datos de otro cliente (HTTP 403 Forbidden).
     */
    public function test_client_cannot_view_other_clients_data(): void
    {
        Sanctum::actingAs($this->clientUser, ['*']);

        $otherClient = Client::create([
            'first_name' => 'Carlos',
            'last_name' => 'Pérez',
            'document_type' => 'CC',
            'document_number' => '55667788',
            'phone' => '3109876543',
            'email' => 'otro.cliente@example.com',
            'status' => 'active',
        ]);

        $response = $this->getJson("/api/v1/clients/{$otherClient->id}");

        $response->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    /**
     * Cliente final puede consultar sus propios datos (HTTP 200 OK).
     */
    public function test_client_can_view_own_data(): void
    {
        Sanctum::actingAs($this->clientUser, ['*']);

        $response = $this->getJson("/api/v1/clients/{$this->client->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.email', 'cliente.propio@autotaller.pro');
    }

    /**
     * Administrador tiene acceso total a todos los módulos y operaciones.
     */
    public function test_admin_has_full_access_to_all_modules(): void
    {
        Sanctum::actingAs($this->admin, ['*']);

        // Acceso a mecánicos
        $respMechanics = $this->getJson('/api/v1/mechanics');
        $respMechanics->assertStatus(200)->assertJsonPath('success', true);

        // Acceso a servicios
        $respServices = $this->getJson('/api/v1/services');
        $respServices->assertStatus(200)->assertJsonPath('success', true);

        // Acceso a clientes
        $respClients = $this->getJson('/api/v1/clients');
        $respClients->assertStatus(200)->assertJsonPath('success', true);
    }
}
