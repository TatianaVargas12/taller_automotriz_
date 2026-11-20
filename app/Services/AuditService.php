<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditService
{
    /**
     * Registra un evento de auditoría en la tabla audit_logs.
     *
     * @param  string  $entityType  Nombre de la entidad (ej. Order, Client, Vehicle)
     * @param  int|null  $entityId  ID de la entidad
     * @param  string  $action  Acción realizada (create, update, delete, transition, cancel, deliver)
     * @param  array<string, mixed>|null  $previousValues  Valores anteriores en JSON
     * @param  array<string, mixed>|null  $newValues  Nuevos valores en JSON
     * @param  int|null  $userId  ID del usuario responsable (por defecto el autenticado)
     */
    public function log(
        string $entityType,
        ?int $entityId,
        string $action,
        ?array $previousValues = null,
        ?array $newValues = null,
        ?int $userId = null
    ): AuditLog {
        return AuditLog::create([
            'user_id' => $userId ?? Auth::id(),
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'action' => $action,
            'previous_values' => $previousValues,
            'new_values' => $newValues,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }
}
