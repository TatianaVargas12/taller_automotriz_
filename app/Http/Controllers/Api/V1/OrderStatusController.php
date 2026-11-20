<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\OrderStatus;
use App\Http\Requests\Orders\CancelOrderRequest;
use App\Http\Requests\Orders\DeliverOrderRequest;
use App\Http\Requests\Orders\TransitionOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderDomainService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class OrderStatusController extends BaseApiController
{
    public function __construct(
        protected OrderDomainService $orderService
    ) {}

    /**
     * Transición ordinaria de estado verificando la máquina de estados y precondiciones de reparación.
     */
    public function transition(TransitionOrderStatusRequest $request, Order $order): JsonResponse
    {
        $user = $request->user();

        // Mecánico solo puede avanzar órdenes asignadas a él
        if ($user && $user->isMechanic() && ! $user->isAdmin() && ! $user->isReceptionist()) {
            $mechanicId = $user->mechanic?->id;
            if (! $mechanicId || ! $order->mechanics()->where('mechanics.id', $mechanicId)->exists()) {
                return $this->error('No tiene permisos para modificar el estado de órdenes no asignadas a su perfil técnico.', Response::HTTP_FORBIDDEN);
            }
        }

        $targetStatusValue = (string) ($request->input('status') ?? $request->input('to_status'));
        $targetStatus = OrderStatus::from($targetStatusValue);

        $updated = $this->orderService->transitionStatus(
            order: $order,
            targetStatus: $targetStatus,
            reason: $request->input('reason'),
            currentUser: $user
        );

        return $this->success(
            new OrderResource($updated->load(['vehicle', 'client', 'mechanics', 'orderServices'])),
            "La orden ha avanzado exitosamente al estado {$targetStatus->label()}."
        );
    }

    /**
     * Entrega formal del vehículo al cliente (RF-5.3, CA-5.3.3, PT-008).
     *
     * REGLA ESTRICTA:
     * La entrega rechaza con HTTP 422 cualquier estado distinto de FINALIZADA.
     * Una vez entregada, la orden queda en solo lectura permanente.
     */
    public function deliver(DeliverOrderRequest $request, Order $order): JsonResponse
    {
        $updated = $this->orderService->deliverOrder(
            order: $order,
            currentUser: $request->user(),
            notes: $request->input('notes')
        );

        return $this->success(
            new OrderResource($updated->load(['vehicle', 'client', 'mechanics', 'orderServices', 'statusHistory'])),
            'Vehículo entregado formalmente al cliente. La orden queda cerrada y bloqueada en solo lectura.'
        );
    }

    /**
     * Cancelación de la orden con motivo justificado y usuario responsable (RF-5.3, CA-5.3.1, PT-010).
     *
     * REGLA ESTRICTA:
     * Solo permitida desde estados previos a FINALIZADA.
     */
    public function cancel(CancelOrderRequest $request, Order $order): JsonResponse
    {
        $reason = (string) ($request->input('cancellation_reason') ?? $request->input('reason'));

        $updated = $this->orderService->cancelOrder(
            order: $order,
            reason: $reason,
            currentUser: $request->user()
        );

        return $this->success(
            new OrderResource($updated->load(['vehicle', 'client', 'statusHistory', 'cancelledBy'])),
            'La orden de servicio ha sido cancelada exitosamente.'
        );
    }
}
