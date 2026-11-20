<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends BaseApiController
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    /**
     * Autenticación de usuario y generación de API token con Laravel Sanctum.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $email = $request->input('email');
        $user = User::with('roles')->where('email', $email)->first();

        if (! $user || ! Hash::check($request->input('password'), $user->password)) {
            $this->auditService->log(
                entityType: 'User',
                entityId: $user?->id,
                action: 'login_failed',
                previousValues: null,
                newValues: [
                    'email' => $email,
                    'reason' => 'invalid_credentials',
                ],
                userId: $user?->id
            );

            return $this->error('Credenciales de acceso inválidas.', Response::HTTP_UNAUTHORIZED);
        }

        if ($user->status !== 'Activo') {
            $this->auditService->log(
                entityType: 'User',
                entityId: $user->id,
                action: 'login_denied_inactive',
                previousValues: null,
                newValues: [
                    'email' => $email,
                    'status' => $user->status,
                ],
                userId: $user->id
            );

            return $this->error('La cuenta de usuario se encuentra inactiva. Contacte al administrador.', Response::HTTP_FORBIDDEN);
        }

        $deviceName = $request->input('device_name', 'api-client');
        $token = $user->createToken($deviceName)->plainTextToken;

        $this->auditService->log(
            entityType: 'User',
            entityId: $user->id,
            action: 'login',
            previousValues: null,
            newValues: [
                'email' => $user->email,
                'device_name' => $deviceName,
            ],
            userId: $user->id
        );

        return $this->success([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => new UserResource($user),
        ], 'Autenticación exitosa.');
    }

    /**
     * Revoca el token actual del usuario (Logout).
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user) {
            if ($user->currentAccessToken()) {
                $user->currentAccessToken()->delete();
            }

            $this->auditService->log(
                entityType: 'User',
                entityId: $user->id,
                action: 'logout',
                previousValues: null,
                newValues: [
                    'email' => $user->email,
                ],
                userId: $user->id
            );
        }

        return $this->success(null, 'Sesión cerrada exitosamente.');
    }

    /**
     * Retorna la información del usuario autenticado con sus roles.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('roles', 'mechanic');

        return $this->success(new UserResource($user), 'Perfil de usuario obtenido.');
    }
}
