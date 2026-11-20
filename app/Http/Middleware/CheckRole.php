<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\AuditService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    /**
     * Maneja la verificación de roles para control de acceso RBAC.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'No autenticado.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        // El Administrador posee acceso y supervisión total en los 5 módulos base (PRD 2.0)
        if ($user->isAdmin()) {
            return $next($request);
        }

        foreach ($roles as $roleGroup) {
            $roleList = explode(',', $roleGroup);
            foreach ($roleList as $role) {
                $trimmed = trim($role);
                if ($user->hasRole($trimmed)) {
                    return $next($request);
                }
            }
        }

        // Registrar acceso denegado en la bitácora de auditoría (PRD 2.0)
        $this->auditService->log(
            entityType: 'Security',
            entityId: null,
            action: 'access_denied',
            previousValues: null,
            newValues: [
                'user_id' => $user->id,
                'email' => $user->email,
                'route' => $request->path(),
                'method' => $request->method(),
                'required_roles' => $roles,
            ],
            userId: $user->id
        );

        return response()->json([
            'success' => false,
            'message' => 'No tiene permisos para realizar esta acción.',
        ], Response::HTTP_FORBIDDEN);
    }
}
