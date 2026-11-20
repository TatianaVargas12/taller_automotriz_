<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Service;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ServiceCatalogService
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    /**
     * Listado paginado del catálogo de servicios con filtros.
     *
     * @param  array<string, mixed>  $filters
     */
    public function list(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return Service::query()
            ->when($filters['search'] ?? null, function (Builder $query, string $search) {
                $query->where(function (Builder $q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%");
                });
            })
            ->when($filters['category'] ?? null, function (Builder $query, string $category) {
                $query->where('category', $category);
            })
            ->when($filters['status'] ?? null, function (Builder $query, string $status) {
                $query->where('status', $status);
            })
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Crea un nuevo servicio en el catálogo con precio base >= 0.
     *
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Service
    {
        $price = (float) $data['base_price'];
        if ($price < 0) {
            throw ValidationException::withMessages([
                'base_price' => ['El precio base del servicio debe ser un valor mayor o igual a cero.'],
            ]);
        }

        return DB::transaction(function () use ($data, $price) {
            $service = Service::create([
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'category' => $data['category'] ?? 'General',
                'base_price' => number_format($price, 2, '.', ''),
                'status' => $data['status'] ?? 'Activo',
            ]);

            $this->auditService->log(
                entityType: 'Service',
                entityId: $service->id,
                action: 'created',
                previousValues: null,
                newValues: $service->toArray()
            );

            return $service;
        });
    }

    /**
     * Actualiza un servicio en el catálogo.
     * Los cambios jamás alteran los snapshots de unit_price de órdenes históricas (RF-4.2).
     *
     * @param  array<string, mixed>  $data
     */
    public function update(Service $service, array $data): Service
    {
        if (isset($data['base_price'])) {
            $price = (float) $data['base_price'];
            if ($price < 0) {
                throw ValidationException::withMessages([
                    'base_price' => ['El precio base no puede ser negativo.'],
                ]);
            }
            $data['base_price'] = number_format($price, 2, '.', '');
        }

        return DB::transaction(function () use ($service, $data) {
            $prev = $service->toArray();
            $service->update($data);

            $this->auditService->log(
                entityType: 'Service',
                entityId: $service->id,
                action: 'updated',
                previousValues: $prev,
                newValues: $service->fresh()->toArray()
            );

            return $service;
        });
    }

    /**
     * Desactivación lógica (Soft Delete) del servicio (RF-4.3).
     */
    public function delete(Service $service): bool
    {
        return DB::transaction(function () use ($service) {
            $prev = $service->toArray();
            $service->update(['status' => 'Inactivo']);
            $deleted = $service->delete();

            $this->auditService->log(
                entityType: 'Service',
                entityId: $service->id,
                action: 'deleted',
                previousValues: $prev,
                newValues: ['deleted_at' => now()->toDateTimeString(), 'status' => 'Inactivo']
            );

            return $deleted;
        });
    }
}
