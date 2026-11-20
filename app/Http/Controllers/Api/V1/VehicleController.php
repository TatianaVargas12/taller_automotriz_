<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Vehicles\StoreVehicleRequest;
use App\Http\Requests\Vehicles\UpdateVehicleRequest;
use App\Http\Resources\OrderResource;
use App\Http\Resources\VehicleResource;
use App\Models\Vehicle;
use App\Services\VehicleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VehicleController extends BaseApiController
{
    public function __construct(
        protected VehicleService $vehicleService
    ) {}

    /**
     * Listado paginado de vehículos.
     */
    public function index(Request $request): JsonResponse
    {
        $vehicles = $this->vehicleService->list(
            filters: $request->only(['search', 'client_id', 'status']),
            perPage: (int) $request->input('per_page', 15)
        );

        return response()->json([
            'success' => true,
            'message' => 'Listado de vehículos obtenido con éxito.',
            'data' => VehicleResource::collection($vehicles->items()),
            'meta' => [
                'current_page' => $vehicles->currentPage(),
                'last_page' => $vehicles->lastPage(),
                'per_page' => $vehicles->perPage(),
                'total' => $vehicles->total(),
            ],
        ], Response::HTTP_OK);
    }

    /**
     * Registro de nuevo vehículo con placa única (RF-2.1).
     */
    public function store(StoreVehicleRequest $request): JsonResponse
    {
        $vehicle = $this->vehicleService->create($request->validated());

        return $this->success(
            new VehicleResource($vehicle),
            'Vehículo registrado exitosamente.',
            Response::HTTP_CREATED
        );
    }

    /**
     * Detalle del vehículo con datos de su propietario.
     */
    public function show(Request $request, Vehicle $vehicle): JsonResponse
    {
        $user = $request->user();
        if ($user && $user->hasRole('client') && ! $user->isAdmin() && ! $user->isReceptionist()) {
            if ($vehicle->client?->email !== $user->email) {
                return $this->error('No tiene permisos para consultar vehículos de otros clientes.', Response::HTTP_FORBIDDEN);
            }
        }

        $vehicle->load('client');

        return $this->success(
            new VehicleResource($vehicle),
            'Detalle del vehículo obtenido.'
        );
    }

    /**
     * Actualización con regla de kilometraje no regresivo (RF-2.2).
     */
    public function update(UpdateVehicleRequest $request, Vehicle $vehicle): JsonResponse
    {
        $updated = $this->vehicleService->update(
            $vehicle,
            $request->validated(),
            $request->user()
        );

        return $this->success(
            new VehicleResource($updated),
            'Vehículo actualizado exitosamente.'
        );
    }

    /**
     * Desactivación lógica (Soft Delete) del vehículo.
     */
    public function destroy(Vehicle $vehicle): JsonResponse
    {
        $this->vehicleService->delete($vehicle);

        return $this->success(
            null,
            'Vehículo desactivado exitosamente.'
        );
    }

    /**
     * Historial de órdenes de servicio e intervenciones del vehículo (RF-2.3).
     */
    public function history(Request $request, Vehicle $vehicle): JsonResponse
    {
        $user = $request->user();
        if ($user && $user->hasRole('client') && ! $user->isAdmin() && ! $user->isReceptionist()) {
            if ($vehicle->client?->email !== $user->email) {
                return $this->error('No tiene permisos para consultar el historial de este vehículo.', Response::HTTP_FORBIDDEN);
            }
        }

        $history = $this->vehicleService->getServiceHistory(
            $vehicle,
            perPage: (int) $request->input('per_page', 10)
        );

        return response()->json([
            'success' => true,
            'message' => 'Historial técnico del vehículo obtenido.',
            'data' => OrderResource::collection($history->items()),
            'meta' => [
                'current_page' => $history->currentPage(),
                'last_page' => $history->lastPage(),
                'per_page' => $history->perPage(),
                'total' => $history->total(),
            ],
        ], Response::HTTP_OK);
    }
}
