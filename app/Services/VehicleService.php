<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VehicleService
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    /**
     * Listado paginado con filtros de placa, VIN o cliente.
     *
     * @param  array<string, mixed>  $filters
     */
    public function list(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return Vehicle::query()
            ->when($filters['search'] ?? null, function (Builder $query, string $search) {
                $query->where(function (Builder $q) use ($search) {
                    $q->where('plate', 'like', "%{$search}%")
                        ->orWhere('vin', 'like', "%{$search}%")
                        ->orWhere('brand', 'like', "%{$search}%")
                        ->orWhere('model', 'like', "%{$search}%");
                });
            })
            ->when($filters['client_id'] ?? null, function (Builder $query, int $clientId) {
                $query->where('client_id', $clientId);
            })
            ->with(['client'])
            ->withCount('orders')
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Registra un vehículo validando unicidad de placa y kilometraje >= 0.
     *
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Vehicle
    {
        $plate = strtoupper(trim($data['plate']));
        $this->ensureUniquePlate($plate);

        return DB::transaction(function () use ($data, $plate) {
            $vehicle = Vehicle::create([
                'client_id' => $data['client_id'],
                'plate' => $plate,
                'brand' => $data['brand'],
                'model' => $data['model'],
                'year' => (int) $data['year'],
                'color' => $data['color'] ?? null,
                'type' => $data['type'] ?? 'Particular',
                'vin' => isset($data['vin']) ? strtoupper(trim($data['vin'])) : null,
                'current_mileage' => (int) ($data['current_mileage'] ?? 0),
                'status' => $data['status'] ?? 'Activo',
            ]);

            $this->auditService->log(
                entityType: 'Vehicle',
                entityId: $vehicle->id,
                action: 'created',
                previousValues: null,
                newValues: $vehicle->toArray()
            );

            return $vehicle;
        });
    }

    /**
     * Actualiza el vehículo validando regla de kilometraje no regresivo (PRD RF-2.2).
     *
     * @param  array<string, mixed>  $data
     * @param  User|null  $currentUser  Usuario que efectúa la actualización
     */
    public function update(Vehicle $vehicle, array $data, ?User $currentUser = null): Vehicle
    {
        if (isset($data['plate'])) {
            $data['plate'] = strtoupper(trim($data['plate']));
            $this->ensureUniquePlate($data['plate'], $vehicle->id);
        }

        // Validación de kilometraje no regresivo (PT-003)
        if (isset($data['current_mileage'])) {
            $newMileage = (int) $data['current_mileage'];
            $this->validateMileageUpdate($vehicle, $newMileage, $data, $currentUser);
        }

        return DB::transaction(function () use ($vehicle, $data) {
            $prev = $vehicle->toArray();
            $vehicle->update($data);

            $this->auditService->log(
                entityType: 'Vehicle',
                entityId: $vehicle->id,
                action: 'updated',
                previousValues: $prev,
                newValues: $vehicle->fresh()->toArray()
            );

            return $vehicle;
        });
    }

    /**
     * Desactivación lógica (Soft Delete) del vehículo.
     */
    public function delete(Vehicle $vehicle): bool
    {
        return DB::transaction(function () use ($vehicle) {
            $prev = $vehicle->toArray();
            $vehicle->update(['status' => 'Inactivo']);
            $deleted = $vehicle->delete();

            $this->auditService->log(
                entityType: 'Vehicle',
                entityId: $vehicle->id,
                action: 'deleted',
                previousValues: $prev,
                newValues: ['deleted_at' => now()->toDateTimeString(), 'status' => 'Inactivo']
            );

            return $deleted;
        });
    }

    /**
     * Retorna el historial consolidado de servicios y órdenes del vehículo (RF-2.3).
     */
    public function getHistory(Vehicle $vehicle): array
    {
        $orders = $vehicle->orders()
            ->with(['services', 'mechanics', 'orderServices', 'statusHistory.user'])
            ->orderBy('entry_at', 'desc')
            ->get();

        return [
            'vehicle' => $vehicle->load('client'),
            'total_orders' => $orders->count(),
            'last_recorded_mileage' => $vehicle->current_mileage,
            'orders' => $orders,
        ];
    }

    /**
     * Valida que el nuevo kilometraje no sea inferior al último registrado en órdenes anteriores.
     * Excepción: Corrección explícita con justificación autorizada por un Administrador (CA-2.2.1).
     *
     * @param  array<string, mixed>  $data
     */
    protected function validateMileageUpdate(Vehicle $vehicle, int $newMileage, array $data, ?User $user): void
    {
        $lastMileage = (int) $vehicle->current_mileage;

        // Comprueba también el mayor kilometraje registrado en órdenes de servicio previas
        $maxOrderMileage = (int) ($vehicle->orders()->max('entry_mileage') ?? 0);
        $referenceMileage = max($lastMileage, $maxOrderMileage);

        if ($newMileage < $referenceMileage) {
            $allowLower = (bool) ($data['allow_lower_mileage'] ?? false);
            $reason = trim((string) ($data['mileage_correction_reason'] ?? ''));

            $isAdmin = $user && $user->isAdmin();

            if (! $isAdmin || ! $allowLower || strlen($reason) < 10) {
                throw ValidationException::withMessages([
                    'current_mileage' => [
                        "El nuevo kilometraje ({$newMileage} km) no puede ser inferior al último registrado ({$referenceMileage} km), salvo corrección justificada autorizada por un Administrador.",
                    ],
                ]);
            }
        }
    }

    /**
     * Valida unicidad de placa vehicular en toda la base de datos (PT-002).
     */
    protected function ensureUniquePlate(string $plate, ?int $ignoreId = null): void
    {
        $exists = Vehicle::withTrashed()
            ->where('plate', $plate)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'plate' => ['La placa ya se encuentra registrada en el sistema.'],
            ]);
        }
    }
}
