<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Clients\StoreClientRequest;
use App\Http\Requests\Clients\UpdateClientRequest;
use App\Http\Resources\ClientResource;
use App\Models\Client;
use App\Services\ClientService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ClientController extends BaseApiController
{
    public function __construct(
        protected ClientService $clientService
    ) {}

    /**
     * Listado paginado de clientes con búsqueda en tiempo real (RF-1.2).
     */
    public function index(Request $request): JsonResponse
    {
        $clients = $this->clientService->list(
            filters: $request->only(['search', 'status']),
            perPage: (int) $request->input('per_page', 15)
        );

        return response()->json([
            'success' => true,
            'message' => 'Listado de clientes obtenido con éxito.',
            'data' => ClientResource::collection($clients->items()),
            'meta' => [
                'current_page' => $clients->currentPage(),
                'last_page' => $clients->lastPage(),
                'per_page' => $clients->perPage(),
                'total' => $clients->total(),
            ],
        ], Response::HTTP_OK);
    }

    /**
     * Registro de nuevo cliente con validación única de documento (RF-1.1).
     */
    public function store(StoreClientRequest $request): JsonResponse
    {
        $client = $this->clientService->create($request->validated());

        return $this->success(
            new ClientResource($client),
            'Cliente registrado exitosamente.',
            Response::HTTP_CREATED
        );
    }

    /**
     * Detalle del cliente con su flota de vehículos vinculada (CA-1.2.1).
     * El rol Cliente Final únicamente puede visualizar sus propios datos.
     */
    public function show(Request $request, Client $client): JsonResponse
    {
        $user = $request->user();
        if ($user && $user->hasRole('client') && ! $user->isAdmin() && ! $user->isReceptionist()) {
            if ($client->email !== $user->email) {
                return $this->error('No tiene permisos para consultar datos de otro cliente.', Response::HTTP_FORBIDDEN);
            }
        }

        $client->load(['vehicles' => fn ($q) => $q->withCount('orders')]);

        return $this->success(
            new ClientResource($client),
            'Detalle de cliente obtenido.'
        );
    }

    /**
     * Actualización de datos del cliente.
     */
    public function update(UpdateClientRequest $request, Client $client): JsonResponse
    {
        $updated = $this->clientService->update($client, $request->validated());

        return $this->success(
            new ClientResource($updated),
            'Información del cliente actualizada con éxito.'
        );
    }

    /**
     * Desactivación lógica (Soft Delete) del cliente (RF-1.3).
     */
    public function destroy(Client $client): JsonResponse
    {
        $this->clientService->delete($client);

        return $this->success(
            null,
            'Cliente desactivado exitosamente.'
        );
    }
}
