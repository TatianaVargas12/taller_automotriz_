<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Mechanics\StoreMechanicRequest;
use App\Http\Requests\Mechanics\UpdateMechanicRequest;
use App\Http\Resources\MechanicResource;
use App\Models\Mechanic;
use App\Services\MechanicService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MechanicController extends BaseApiController
{
    public function __construct(
        protected MechanicService $mechanicService
    ) {}

    /**
     * Listado paginado de mecánicos.
     */
    public function index(Request $request): JsonResponse
    {
        $mechanics = $this->mechanicService->list(
            filters: $request->only(['search', 'specialty', 'status']),
            perPage: (int) $request->input('per_page', 15)
        );

        return response()->json([
            'success' => true,
            'message' => 'Listado de mecánicos obtenido con éxito.',
            'data' => MechanicResource::collection($mechanics->items()),
            'meta' => [
                'current_page' => $mechanics->currentPage(),
                'last_page' => $mechanics->lastPage(),
                'per_page' => $mechanics->perPage(),
                'total' => $mechanics->total(),
            ],
        ], Response::HTTP_OK);
    }

    /**
     * Registro de nuevo mecánico con documento único (RF-3.1).
     */
    public function store(StoreMechanicRequest $request): JsonResponse
    {
        $mechanic = $this->mechanicService->create($request->validated());

        return $this->success(
            new MechanicResource($mechanic),
            'Mecánico registrado exitosamente.',
            Response::HTTP_CREATED
        );
    }

    /**
     * Detalle del mecánico con órdenes de trabajo activas.
     */
    public function show(Mechanic $mechanic): JsonResponse
    {
        $mechanic->load(['orders' => fn ($q) => $q->whereNotIn('status', ['ENTREGADA', 'CANCELADA'])]);

        return $this->success(
            new MechanicResource($mechanic),
            'Ficha técnica del mecánico obtenida.'
        );
    }

    /**
     * Actualización de la ficha técnica.
     */
    public function update(UpdateMechanicRequest $request, Mechanic $mechanic): JsonResponse
    {
        $updated = $this->mechanicService->update($mechanic, $request->validated());

        return $this->success(
            new MechanicResource($updated),
            'Ficha del mecánico actualizada exitosamente.'
        );
    }

    /**
     * Alterna o actualiza el estado de disponibilidad del mecánico (is_active).
     */
    public function status(Request $request, Mechanic $mechanic): JsonResponse
    {
        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $updated = $this->mechanicService->update($mechanic, $validated);

        return $this->success(
            new MechanicResource($updated),
            'Estado del mecánico actualizado con éxito.'
        );
    }

    /**
     * Desactivación / eliminación del mecánico.
     */
    public function destroy(Mechanic $mechanic): JsonResponse
    {
        $this->mechanicService->delete($mechanic);

        return $this->success(
            null,
            'Mecánico procesado exitosamente.'
        );
    }
}
