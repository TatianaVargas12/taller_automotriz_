<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use RuntimeException;

class PasswordRecoveryService
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    /**
     * Recuperación de Nombre de Usuario por Correo o Teléfono.
     * Retorna mensaje neutro para evitar enumeración de usuarios.
     */
    public function recoverUsername(string $channel, string $identifier, string $ip = '127.0.0.1'): array
    {
        $rateLimitKey = 'recover_username:' . md5($identifier . '|' . $ip);
        if (RateLimiter::tooManyAttempts($rateLimitKey, 5)) {
            $seconds = RateLimiter::availableIn($rateLimitKey);
            return [
                'success' => false,
                'message' => "Demasiadas solicitudes de recuperación. Inténtalo de nuevo en {$seconds} segundos.",
                'rate_limited' => true,
            ];
        }
        RateLimiter::hit($rateLimitKey, 900); // 15 minutos de ventana

        // Búsqueda de usuario sin filtrar respuesta pública
        $user = null;
        if ($channel === 'email') {
            $user = User::where('email', $identifier)->first();
        } else {
            // Si es teléfono, busca por relación con mecánico o por correo
            $user = User::whereHas('mechanic', function ($q) use ($identifier) {
                $q->where('phone', $identifier);
            })->first();
        }

        if ($user) {
            $this->auditService->log(
                entityType: 'User',
                entityId: $user->id,
                action: 'username_recovery_dispatched',
                previousValues: null,
                newValues: [
                    'channel' => $channel,
                    'identifier' => $identifier,
                ],
                userId: $user->id
            );
        }

        $response = [
            'success' => true,
            'message' => 'Si los datos corresponden a una cuenta registrada, te hemos enviado tu nombre de usuario al canal indicado.',
        ];

        // En entornos locales/pruebas exponemos el dato simulado para validación inmediata
        if (config('app.debug', true) && $user) {
            $response['debug_simulation'] = [
                'username' => $user->name,
                'email' => $user->email,
                'channel' => $channel,
            ];
        }

        return $response;
    }

    /**
     * Solicitud de Restablecimiento de Contraseña (Emisión de Código SMS o Enlace por Correo).
     * Los códigos y tokens se almacenan EXCLUSIVAMENTE como hash SHA-256 (nunca texto plano).
     */
    public function requestPasswordReset(string $channel, string $identifier, string $ip = '127.0.0.1'): array
    {
        $rateLimitKey = 'pwd_reset_req:' . md5($identifier . '|' . $ip);
        if (RateLimiter::tooManyAttempts($rateLimitKey, 5)) {
            $seconds = RateLimiter::availableIn($rateLimitKey);
            return [
                'success' => false,
                'message' => "Has alcanzado el límite de intentos permitidos. Espera {$seconds} segundos para volver a intentarlo.",
                'rate_limited' => true,
            ];
        }
        RateLimiter::hit($rateLimitKey, 900);

        // Buscar usuario por email o nombre
        $user = User::where('email', $identifier)
            ->orWhere('name', $identifier)
            ->first();

        if (! $user && $channel === 'phone') {
            $user = User::whereHas('mechanic', function ($q) use ($identifier) {
                $q->where('phone', $identifier);
            })->first();
        }

        $plainCode = '';
        if ($user) {
            // Invalidar tokens previos del mismo identificador
            DB::table('password_reset_tokens')->where('identifier', $identifier)->delete();

            // Código de 6 dígitos numéricos para SMS o token alfanumérico para email
            $plainCode = $channel === 'phone'
                ? (string) random_int(100000, 999999)
                : bin2hex(random_bytes(16));

            $hashedToken = hash('sha256', $plainCode);

            DB::table('password_reset_tokens')->insert([
                'identifier' => $identifier,
                'token' => $hashedToken,
                'channel' => $channel,
                'type' => 'password',
                'attempts' => 0,
                'expires_at' => now()->addMinutes(15),
                'created_at' => now(),
            ]);

            $this->auditService->log(
                entityType: 'User',
                entityId: $user->id,
                action: 'password_reset_code_dispatched',
                previousValues: null,
                newValues: [
                    'channel' => $channel,
                    'identifier' => $identifier,
                    'expires_at' => now()->addMinutes(15)->toIso8601String(),
                ],
                userId: $user->id
            );
        }

        $response = [
            'success' => true,
            'message' => 'Si los datos corresponden a una cuenta registrada, hemos enviado las instrucciones de restablecimiento al canal indicado.',
        ];

        if (config('app.debug', true) && $plainCode) {
            $response['debug_simulation'] = [
                'code_or_token' => $plainCode,
                'expires_in_minutes' => 15,
                'channel' => $channel,
            ];
        }

        return $response;
    }

    /**
     * Verificación del Código SMS de 6 dígitos o Token de Restablecimiento.
     * Si supera 5 intentos fallidos, el código se invalida inmediatamente.
     */
    public function verifyCode(string $identifier, string $code): array
    {
        $record = DB::table('password_reset_tokens')
            ->where('identifier', $identifier)
            ->where('expires_at', '>', now())
            ->first();

        if (! $record) {
            return [
                'valid' => false,
                'message' => 'El código de seguridad ha expirado o no existe una solicitud activa.',
            ];
        }

        if ($record->attempts >= 5) {
            DB::table('password_reset_tokens')->where('id', $record->id)->delete();
            return [
                'valid' => false,
                'message' => 'Se ha excedido el límite de intentos fallidos. Solicita un nuevo código.',
            ];
        }

        $hashedInput = hash('sha256', $code);
        if (! hash_equals($record->token, $hashedInput)) {
            DB::table('password_reset_tokens')->where('id', $record->id)->increment('attempts');
            $remaining = 4 - $record->attempts;
            return [
                'valid' => false,
                'message' => "El código ingresado es incorrecto. Intentos restantes: {$remaining}.",
            ];
        }

        // Generar token temporal de autorización de reseteo (válido por 10 minutos)
        $sessionAuthToken = bin2hex(random_bytes(24));
        DB::table('password_reset_tokens')->where('id', $record->id)->update([
            'token' => hash('sha256', $sessionAuthToken),
            'type' => 'authorized_reset',
            'expires_at' => now()->addMinutes(10),
        ]);

        return [
            'valid' => true,
            'reset_token' => $sessionAuthToken,
            'message' => 'Código verificado con éxito. Ya puedes definir tu nueva contraseña.',
        ];
    }

    /**
     * Define la nueva contraseña, la guarda hasheada con bcrypt e invalida el token.
     */
    public function resetPassword(string $identifier, string $resetToken, string $newPassword): array
    {
        $hashedToken = hash('sha256', $resetToken);

        $record = DB::table('password_reset_tokens')
            ->where('identifier', $identifier)
            ->where('token', $hashedToken)
            ->where('expires_at', '>', now())
            ->first();

        if (! $record) {
            return [
                'success' => false,
                'message' => 'La sesión de restablecimiento es inválida o ha caducado. Vuelve a iniciar el proceso.',
            ];
        }

        $user = User::where('email', $identifier)
            ->orWhere('name', $identifier)
            ->first();

        if (! $user) {
            $user = User::whereHas('mechanic', function ($q) use ($identifier) {
                $q->where('phone', $identifier);
            })->first();
        }

        if (! $user) {
            DB::table('password_reset_tokens')->where('id', $record->id)->delete();
            return [
                'success' => false,
                'message' => 'No se encontró el usuario vinculado a este restablecimiento.',
            ];
        }

        // Hasheo seguro de la nueva contraseña con bcrypt
        $user->password = Hash::make($newPassword);
        $user->save();

        // Invalidar de inmediato el token de restablecimiento tras su uso único
        DB::table('password_reset_tokens')->where('id', $record->id)->delete();

        $this->auditService->log(
            entityType: 'User',
            entityId: $user->id,
            action: 'password_reset_completed',
            previousValues: null,
            newValues: [
                'identifier' => $identifier,
                'channel' => $record->channel,
            ],
            userId: $user->id
        );

        return [
            'success' => true,
            'message' => 'Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva clave.',
        ];
    }
}
