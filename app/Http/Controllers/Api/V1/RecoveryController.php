<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Auth\RecoverUsernameRequest;
use App\Http\Requests\Auth\RequestPasswordResetRequest;
use App\Http\Requests\Auth\ResetPasswordWithCodeRequest;
use App\Http\Requests\Auth\VerifyRecoveryCodeRequest;
use App\Services\PasswordRecoveryService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class RecoveryController extends BaseApiController
{
    public function __construct(
        protected PasswordRecoveryService $recoveryService
    ) {}

    /**
     * Recuperación de Nombre de Usuario por Email o SMS.
     */
    public function recoverUsername(RecoverUsernameRequest $request): JsonResponse
    {
        $result = $this->recoveryService->recoverUsername(
            channel: $request->input('channel'),
            identifier: $request->input('identifier'),
            ip: (string) $request->ip()
        );

        if (! empty($result['rate_limited'])) {
            return $this->error($result['message'], Response::HTTP_TOO_MANY_REQUESTS);
        }

        return $this->success(
            data: $result['debug_simulation'] ?? null,
            message: $result['message']
        );
    }

    /**
     * Solicitud de Restablecimiento de Contraseña (Genera código SMS o enlace).
     */
    public function requestPasswordReset(RequestPasswordResetRequest $request): JsonResponse
    {
        $result = $this->recoveryService->requestPasswordReset(
            channel: $request->input('channel'),
            identifier: $request->input('identifier'),
            ip: (string) $request->ip()
        );

        if (! empty($result['rate_limited'])) {
            return $this->error($result['message'], Response::HTTP_TOO_MANY_REQUESTS);
        }

        return $this->success(
            data: $result['debug_simulation'] ?? null,
            message: $result['message']
        );
    }

    /**
     * Verificación del Código SMS de 6 dígitos o Token de Seguridad.
     */
    public function verifyCode(VerifyRecoveryCodeRequest $request): JsonResponse
    {
        $result = $this->recoveryService->verifyCode(
            identifier: $request->input('identifier'),
            code: $request->input('code')
        );

        if (! $result['valid']) {
            return $this->error($result['message'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return $this->success(
            data: ['reset_token' => $result['reset_token']],
            message: $result['message']
        );
    }

    /**
     * Definición de la Nueva Contraseña (con invalidación de token).
     */
    public function resetPassword(ResetPasswordWithCodeRequest $request): JsonResponse
    {
        $result = $this->recoveryService->resetPassword(
            identifier: $request->input('identifier'),
            resetToken: $request->input('reset_token'),
            newPassword: $request->input('password')
        );

        if (! $result['success']) {
            return $this->error($result['message'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return $this->success(
            data: null,
            message: $result['message']
        );
    }
}
