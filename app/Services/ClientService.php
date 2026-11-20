<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Client;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ClientService
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    /**
     * Obtiene el listado de clientes paginado con filtros de búsqueda.
     *
     * @param  array<string, mixed>  $filters
     */
    public function list(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return Client::query()
            ->when($filters['search'] ?? null, function (Builder $query, string $search) {
                $query->where(function (Builder $q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('document_number', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($filters['status'] ?? null, function (Builder $query, string $status) {
                $query->where('status', $status);
            })
            ->withCount(['vehicles', 'orders'])
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Registra un nuevo cliente validando la unicidad compuesta de tipo + número de documento.
     *
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Client
    {
        $this->ensureUniqueDocument($data['document_type'], $data['document_number']);

        return DB::transaction(function () use ($data) {
            $client = Client::create([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'document_type' => $data['document_type'],
                'document_number' => $data['document_number'],
                'phone' => $data['phone'],
                'email' => $data['email'] ?? null,
                'address' => $data['address'] ?? null,
                'status' => $data['status'] ?? 'Activo',
            ]);

            $this->auditService->log(
                entityType: 'Client',
                entityId: $client->id,
                action: 'created',
                previousValues: null,
                newValues: $client->toArray()
            );

            return $client;
        });
    }

    /**
     * Actualiza la información de un cliente existente.
     *
     * @param  array<string, mixed>  $data
     */
    public function update(Client $client, array $data): Client
    {
        $docType = $data['document_type'] ?? $client->document_type;
        $docNum = $data['document_number'] ?? $client->document_number;

        $this->ensureUniqueDocument($docType, $docNum, $client->id);

        return DB::transaction(function () use ($client, $data) {
            $prev = $client->toArray();
            $client->update($data);

            $this->auditService->log(
                entityType: 'Client',
                entityId: $client->id,
                action: 'updated',
                previousValues: $prev,
                newValues: $client->fresh()->toArray()
            );

            return $client;
        });
    }

    /**
     * Aplica desactivación lógica (Soft Delete) conservando la integridad de órdenes y vehículos.
     */
    public function delete(Client $client): bool
    {
        return DB::transaction(function () use ($client) {
            $prev = $client->toArray();
            $client->update(['status' => 'Inactivo']);
            $deleted = $client->delete();

            $this->auditService->log(
                entityType: 'Client',
                entityId: $client->id,
                action: 'deleted',
                previousValues: $prev,
                newValues: ['deleted_at' => now()->toDateTimeString(), 'status' => 'Inactivo']
            );

            return $deleted;
        });
    }

    /**
     * Valida que no exista otro cliente con el mismo tipo y número de documento (RF-1.1, CA-1.1.2).
     */
    protected function ensureUniqueDocument(string $docType, string $docNum, ?int $ignoreId = null): void
    {
        $exists = Client::withTrashed()
            ->where('document_type', $docType)
            ->where('document_number', $docNum)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'document_number' => ['El documento ingresado ya se encuentra registrado para este tipo de identificación.'],
            ]);
        }
    }
}
