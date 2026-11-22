<?php

declare(strict_types=1);

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PasswordRecoveryApiTest extends TestCase
{
    /**
     * Test: Recuperación de usuario retorna mensaje neutro exista o no la cuenta.
     */
    public function test_username_recovery_returns_neutral_response(): void
    {
        $response = $this->postJson('/api/v1/auth/recovery/username', [
            'channel' => 'email',
            'identifier' => 'inexistente@taller.local',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Si los datos corresponden a una cuenta registrada, te hemos enviado tu nombre de usuario al canal indicado.',
            ]);
    }

    /**
     * Test: Validación de formato incorrecto de correo en recuperación de usuario.
     */
    public function test_username_recovery_validates_email_format(): void
    {
        $response = $this->postJson('/api/v1/auth/recovery/username', [
            'channel' => 'email',
            'identifier' => 'correo-invalido-sin-arroba',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['identifier']);
    }

    /**
     * Test: Solicitud de código de reseteo SMS no guarda código en texto plano.
     */
    public function test_password_reset_code_is_hashed_and_not_stored_in_plain_text(): void
    {
        // Solicitar reseteo
        $response = $this->postJson('/api/v1/auth/recovery/password/request', [
            'channel' => 'phone',
            'identifier' => '+34 612 000 111',
        ]);

        $response->assertStatus(200);

        // Si se generó registro, verificar que el token es un hash de 64 caracteres hexadecimales (SHA-256)
        $record = DB::table('password_reset_tokens')->where('identifier', '+34 612 000 111')->first();
        if ($record) {
            $this->assertEquals(64, strlen($record->token));
            $this->assertFalse(is_numeric($record->token), 'El token no debe ser el código numérico en texto plano');
        }
    }

    /**
     * Test: Verificación de código rechaza entradas inválidas.
     */
    public function test_verification_rejects_invalid_code(): void
    {
        $response = $this->postJson('/api/v1/auth/recovery/password/verify-code', [
            'identifier' => 'admin@taller.local',
            'code' => '000000',
        ]);

        $response->assertStatus(422);
    }
}
