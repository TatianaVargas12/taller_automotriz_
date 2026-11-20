<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    /**
     * Prueba login exitoso retornando token Bearer, datos de usuario y registro en auditoría (HTTP 200).
     */
    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'operador@autotaller.pro',
            'password' => Hash::make('password123'),
            'status' => 'Activo',
        ]);
        $role = Role::where('slug', 'receptionist')->first();
        $user->roles()->attach($role);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'operador@autotaller.pro',
            'password' => 'password123',
            'device_name' => 'test-device',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'token',
                    'token_type',
                    'user' => ['id', 'name', 'email', 'roles'],
                ],
            ]);

        $this->assertTrue($response->json('success'));

        // Verifica auditoría de inicio de sesión
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $user->id,
            'action' => 'login',
        ]);
    }

    /**
     * Prueba rechazo de login con credenciales erróneas y registro en auditoría (HTTP 401).
     */
    public function test_login_fails_with_invalid_credentials(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'noexiste@autotaller.pro',
            'password' => 'clave-erronea',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Credenciales de acceso inválidas.',
            ]);

        // Verifica auditoría de intento fallido
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'login_failed',
        ]);
    }

    /**
     * Prueba acceso denegado a rutas protegidas sin token de sesión (HTTP 401).
     */
    public function test_unauthenticated_request_is_rejected(): void
    {
        $response = $this->getJson('/api/v1/auth/me');

        $response->assertStatus(401);
    }

    /**
     * Prueba endpoint /me retorna el usuario autenticado con sus roles (HTTP 200).
     */
    public function test_authenticated_user_can_retrieve_profile(): void
    {
        $admin = User::first();

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'email' => $admin->email,
                ],
            ]);
    }

    /**
     * Prueba logout revoca el token actual y registra evento en auditoría (HTTP 200).
     */
    public function test_user_can_logout_and_revoke_token(): void
    {
        $user = User::first();
        $token = $user->createToken('test-token');

        $response = $this->withHeader('Authorization', 'Bearer ' . $token->plainTextToken)
            ->postJson('/api/v1/auth/logout');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Sesión cerrada exitosamente.',
            ]);

        // Verifica que el token fue eliminado/revocado
        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $token->accessToken->id,
        ]);

        // Verifica registro en auditoría de cierre de sesión
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $user->id,
            'action' => 'logout',
        ]);

        // Prueba que el token revocado ya no tiene acceso a endpoints protegidos (HTTP 401)
        $followUpResponse = $this->withHeader('Authorization', 'Bearer ' . $token->plainTextToken)
            ->getJson('/api/v1/auth/me');

        $followUpResponse->assertStatus(401);
    }
}
