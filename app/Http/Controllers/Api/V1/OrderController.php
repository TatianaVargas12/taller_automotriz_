<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Orders\AddOrderServiceRequest;
use App\Http\Requests\Orders\AssignOrderMechanicRequest;
use App\Http\Requests\Orders\StoreOrderRequest;
use App\Http\Requests\Orders\UpdateOrderRequest;
use App\Http\Resources\OrderResource;
use App\Http\Resources\OrderServiceResource;
use App\Http\Resources\OrderStatusHistoryResource;
use App\Models\Client;
use App\Models\Mechanic;
use App\Models\Order;
use App\Models\OrderService;
use App\Services\OrderDomainService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class OrderController extends BaseApiController
{
    public function __construct(
        protected OrderDomainService $orderService
    ) {}

    /**
     * Listado paginado de órdenes de servicio.
     * Aplica filtros automáticos por rol: Mecánico (asignadas) y Cliente Final (propias).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $filters = $request->only(['search', 'status', 'vehicle_id', 'client_id', 'mechanic_id']);

        if ($user && $user->isMechanic() && ! $user->isAdmin() && ! $user->isReceptionist()) {
            $filters['mechanic_id'] = $user->mechanic?->id ?? -1;
        } elseif ($user && $user->hasRole('client') && ! $user->isAdmin() && ! $user->isReceptionist() && ! $user->isMechanic()) {
            $client = Client::where('email', $user->email)->first();
            $filters['client_id'] = $client?->id ?? -1;
        }

        $orders = $this->orderService->list(
            filters: $filters,
            perPage: (int) $request->input('per_page', 15)
        );

        return response()->json([
            'success' => true,
            'message' => 'Listado de órdenes obtenido con éxito.',
            'data' => OrderResource::collection($orders->items()),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ], Response::HTTP_OK);
    }

    /**
     * Apertura de una nueva orden de servicio con correlativo atómico (RF-5.1).
     */
    public function store(StoreOrderRequest $request): JsonResponse
    {
        $order = $this->orderService->openOrder(
            data: $request->validated(),
            currentUser: $request->user()
        );

        $order->load(['vehicle.client', 'client']);

        return $this->success(
            new OrderResource($order),
            "Orden de servicio {$order->order_number} aperturada exitosamente.",
            Response::HTTP_CREATED
        );
    }

    /**
     * Detalle completo de la orden con sus snapshots de líneas, mecánicos y trazabilidad.
     */
    public function show(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();

        if ($user && $user->isMechanic() && ! $user->isAdmin() && ! $user->isReceptionist()) {
            $mechanicId = $user->mechanic?->id;
            if (! $mechanicId || ! $order->mechanics()->where('mechanics.id', $mechanicId)->exists()) {
                return $this->error('No tiene permisos para consultar órdenes no asignadas a su perfil técnico.', Response::HTTP_FORBIDDEN);
            }
        } elseif ($user && $user->hasRole('client') && ! $user->isAdmin() && ! $user->isReceptionist() && ! $user->isMechanic()) {
            $client = Client::where('email', $user->email)->first();
            if (! $client || $order->client_id !== $client->id) {
                return $this->error('No tiene permisos para consultar órdenes de otros clientes.', Response::HTTP_FORBIDDEN);
            }
        }

        $order->load([
            'vehicle.client',
            'client',
            'orderServices',
            'mechanics',
            'statusHistory.user',
            'cancelledBy',
        ]);

        return $this->success(
            new OrderResource($order),
            'Detalle de la orden obtenido con éxito.'
        );
    }

    /**
     * Bitácora inmutable de transiciones de estado de la orden.
     */
    public function history(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();

        if ($user && $user->isMechanic() && ! $user->isAdmin() && ! $user->isReceptionist()) {
            $mechanicId = $user->mechanic?->id;
            if (! $mechanicId || ! $order->mechanics()->where('mechanics.id', $mechanicId)->exists()) {
                return $this->error('No tiene permisos para consultar el historial de órdenes no asignadas a su perfil técnico.', Response::HTTP_FORBIDDEN);
            }
        } elseif ($user && $user->hasRole('client') && ! $user->isAdmin() && ! $user->isReceptionist() && ! $user->isMechanic()) {
            $client = Client::where('email', $user->email)->first();
            if (! $client || $order->client_id !== $client->id) {
                return $this->error('No tiene permisos para consultar el historial de órdenes de otros clientes.', Response::HTTP_FORBIDDEN);
            }
        }

        $order->load('statusHistory.user');

        return $this->success(
            OrderStatusHistoryResource::collection($order->statusHistory),
            'Historial de transiciones de estado de la orden obtenido con éxito.'
        );
    }

    /**
     * Actualiza notas operativas o diagnóstico preliminar (Bloqueado si ENTREGADA).
     */
    public function update(UpdateOrderRequest $request, Order $order): JsonResponse
    {
        $user = $request->user();

        if ($user && $user->isMechanic() && ! $user->isAdmin() && ! $user->isReceptionist()) {
            $mechanicId = $user->mechanic?->id;
            if (! $mechanicId || ! $order->mechanics()->where('mechanics.id', $mechanicId)->exists()) {
                return $this->error('No tiene permisos para modificar órdenes no asignadas a su perfil técnico.', Response::HTTP_FORBIDDEN);
            }
        }

        $this->orderService->ensureNotReadOnly($order);

        $order->update($request->validated());

        return $this->success(
            new OrderResource($order->fresh(['vehicle', 'client'])),
            'Información de la orden actualizada.'
        );
    }

    /**
     * Carga un servicio a la orden copiando el precio unitario como snapshot inmutable (RF-4.2).
     */
    public function addService(AddOrderServiceRequest $request, Order $order): JsonResponse
    {
        $orderService = $this->orderService->addService(
            order: $order,
            data: $request->validated(),
            currentUser: $request->user()
        );

        return $this->success(
            new OrderServiceResource($orderService),
            'Servicio agregado a la orden con snapshot de precio congelado.',
            Response::HTTP_CREATED
        );
    }

    /**
     * Elimina una línea de servicio de la orden.
     */
    public function removeService(Order $order, OrderService $orderService, Request $request): JsonResponse
    {
        $this->orderService->removeService(
            order: $order,
            orderService: $orderService,
            currentUser: $request->user()
        );

        return $this->success(
            null,
            'Servicio retirado de la orden y totales recalculados.'
        );
    }

    /**
     * Asigna un mecánico activo a la orden previniendo duplicados (PT-004, PT-005).
     */
    public function assignMechanic(AssignOrderMechanicRequest $request, Order $order): JsonResponse
    {
        $this->orderService->assignMechanic(
            order: $order,
            data: $request->validated(),
            currentUser: $request->user()
        );

        return $this->success(
            new OrderResource($order->fresh(['mechanics'])),
            'Mecánico asignado exitosamente a la orden de trabajo.'
        );
    }

    /**
     * Desvincula un mecánico de la orden.
     */
    public function unassignMechanic(Order $order, Mechanic $mechanic, Request $request): JsonResponse
    {
        $this->orderService->unassignMechanic(
            order: $order,
            mechanic: $mechanic,
            currentUser: $request->user()
        );

        return $this->success(
            null,
            'Mecánico desvinculado de la orden de trabajo.'
        );
    }
}
