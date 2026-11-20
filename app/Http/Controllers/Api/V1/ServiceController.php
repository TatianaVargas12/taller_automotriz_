<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Services\StoreServiceRequest;
use App\Http\Requests\Services\UpdateServiceRequest;
use App\Http\Resources\ServiceResource;
use App\Models\Service;
use App\Services\ServiceCatalogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ServiceController extends BaseApiController
{
    public function __construct(
        protected ServiceCatalogService $catalogService
    ) {}

    /**
     * Listado paginado de servicios del catálogo.
     */
    public function index(Request $request): JsonResponse
    {
        $services = $this->catalogService->list(
            filters: $request->only(['search', 'category', 'status']),
            perPage: (int) $request->input('per_page', 15)
        );

        return response()->json([
            'success' => true,
            'message' => 'Catálogo de servicios obtenido con éxito.',
            'data' => ServiceResource::collection($services->items()),
            'meta' => [
                'current_page' => $services->currentPage(),
                'last_page' => $services->lastPage(),
                'per_page' => $services->perPage(),
                'total' => $services->total(),
            ],
        ], Response::HTTP_OK);
    }

    /**
     * Creación de nuevo servicio con precio base >= 0 (RF-4.1).
     */
    public function store(StoreServiceRequest $request): JsonResponse
    {
        $service = $this->catalogService->create($request->validated());

        return $this->success(
            new ServiceResource($service),
            'Servicio registrado exitosamente en el catálogo.',
            Response::HTTP_CREATED
        );
    }

    /**
     * Detalle de un servicio.
     */
    public function show(Service $service): JsonResponse
    {
        return $this->success(
            new ServiceResource($service),
            'Detalle del servicio obtenido.'
        );
    }

    /**
     * Actualización del servicio sin alterar snapshots históricos (RF-4.2).
     */
    public function update(UpdateServiceRequest $request, Service $service): JsonResponse
    {
        $updated = $this->catalogService->update($service, $request->validated());

        return $this->success(
            new ServiceResource($updated),
            'Servicio actualizado exitosamente.'
        );
    }

    /**
     * Desactivación lógica (Soft Delete) del servicio (RF-4.3).
     */
    public function destroy(Service $service): JsonResponse
    {
        $this->catalogService->delete($service);

        return $this->success(
            null,
            'Servicio desactivado del catálogo.'
        );
    }
}
