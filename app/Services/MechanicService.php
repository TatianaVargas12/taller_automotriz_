<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Mechanic;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MechanicService
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    /**
     * Listado paginado de mecánicos con filtros de especialidad y estado.
     *
     * @param  array<string, mixed>  $filters
     */
    public function list(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return Mechanic::query()
            ->when($filters['search'] ?? null, function (Builder $query, string $search) {
                $query->where(function (Builder $q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('document_number', 'like', "%{$search}%")
                        ->orWhere('specialty', 'like', "%{$search}%");
                });
            })
            ->when($filters['status'] ?? null, function (Builder $query, string $status) {
                $query->where('status', $status);
            })
            ->when($filters['specialty'] ?? null, function (Builder $query, string $specialty) {
                $query->where('specialty', $specialty);
            })
            ->withCount('orders')
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Registra un mecánico con documento de identidad único obligatorio (RF-3.1, CA-3.1.1).
     *
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Mechanic
    {
        $this->ensureUniqueDocument($data['document_number']);

        return DB::transaction(function () use ($data) {
            $mechanic = Mechanic::create([
                'user_id' => $data['user_id'] ?? null,
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'document_number' => $data['document_number'],
                'phone' => $data['phone'],
                'email' => $data['email'] ?? null,
                'specialty' => $data['specialty'] ?? 'Mecánica General',
                'status' => $data['status'] ?? 'Activo',
            ]);

            $this->auditService->log(
                entityType: 'Mechanic',
                entityId: $mechanic->id,
                action: 'created',
                previousValues: null,
                newValues: $mechanic->toArray()
            );

            return $mechanic;
        });
    }

    /**
     * Actualiza la ficha técnica del mecánico.
     *
     * @param  array<string, mixed>  $data
     */
    public function update(Mechanic $mechanic, array $data): Mechanic
    {
        if (isset($data['document_number'])) {
            $this->ensureUniqueDocument($data['document_number'], $mechanic->id);
        }

        return DB::transaction(function () use ($mechanic, $data) {
            $prev = $mechanic->toArray();
            $mechanic->update($data);

            $this->auditService->log(
                entityType: 'Mechanic',
                entityId: $mechanic->id,
                action: 'updated',
                previousValues: $prev,
                newValues: $mechanic->fresh()->toArray()
            );

            return $mechanic;
        });
    }

    /**
     * Desactiva el mecánico o elimina si no tiene órdenes asociadas.
     */
    public function delete(Mechanic $mechanic): bool
    {
        return DB::transaction(function () use ($mechanic) {
            $prev = $mechanic->toArray();

            // Si tiene órdenes vinculadas, se desactiva para no romper trazabilidad
            if ($mechanic->orders()->exists()) {
                $mechanic->update(['status' => 'Inactivo']);
                $deleted = true;
            } else {
                $deleted = $mechanic->delete();
            }

            $this->auditService->log(
                entityType: 'Mechanic',
                entityId: $mechanic->id,
                action: 'deleted_or_deactivated',
                previousValues: $prev,
                newValues: ['status' => 'Inactivo']
            );

            return (bool) $deleted;
        });
    }

    /**
     * Valida que no exista otro mecánico con el mismo documento.
     */
    protected function ensureUniqueDocument(string $docNumber, ?int $ignoreId = null): void
    {
        $exists = Mechanic::where('document_number', $docNumber)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'document_number' => ['El documento del mecánico ya se encuentra registrado.'],
            ]);
        }
    }
}
