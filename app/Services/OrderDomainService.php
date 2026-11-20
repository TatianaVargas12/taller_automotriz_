<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\Mechanic;
use App\Models\Order;
use App\Models\OrderService;
use App\Models\OrderStatusHistory;
use App\Models\Service;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderDomainService
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    /**
     * Listado paginado de órdenes de servicio con filtros avanzados.
     *
     * @param  array<string, mixed>  $filters
     */
    public function list(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return Order::query()
            ->when($filters['search'] ?? null, function (Builder $query, string $search) {
                $query->where(function (Builder $q) use ($search) {
                    $q->where('order_number', 'like', "%{$search}%")
                        ->orWhere('reported_issue', 'like', "%{$search}%")
                        ->orWhereHas('vehicle', fn ($v) => $v->where('plate', 'like', "%{$search}%"))
                        ->orWhereHas('client', fn ($c) => $c->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('document_number', 'like', "%{$search}%")
                        );
                });
            })
            ->when($filters['status'] ?? null, function (Builder $query, string $status) {
                $query->where('status', $status);
            })
            ->when($filters['vehicle_id'] ?? null, function (Builder $query, int $vehicleId) {
                $query->where('vehicle_id', $vehicleId);
            })
            ->when($filters['client_id'] ?? null, function (Builder $query, int $clientId) {
                $query->where('client_id', $clientId);
            })
            ->when($filters['mechanic_id'] ?? null, function (Builder $query, int $mechanicId) {
                $query->whereHas('mechanics', fn ($m) => $m->where('mechanics.id', $mechanicId));
            })
            ->with(['vehicle', 'client', 'mechanics', 'orderServices'])
            ->latest('id')
            ->paginate($perPage);
    }

    /**
     * Apertura de una nueva Orden de Servicio (RF-5.1).
     *
     * Reglas:
     * - Generación atómica de folio único secuencial (ORD-YYYY-XXXX).
     * - Kilometraje de entrada no inferior al del vehículo.
     * - Estado inicial: PENDIENTE.
     * - Bitácora en order_status_history y audit_logs.
     *
     * @param  array<string, mixed>  $data
     */
    public function openOrder(array $data, ?User $currentUser = null): Order
    {
        return DB::transaction(function () use ($data, $currentUser) {
            $vehicle = Vehicle::findOrFail($data['vehicle_id']);
            $entryMileage = (int) $data['entry_mileage'];

            // Valida que el kilometraje de entrada sea consistente (>= vehículo)
            if ($entryMileage < $vehicle->current_mileage) {
                $allowLower = (bool) ($data['allow_lower_mileage'] ?? false);
                $reason = trim((string) ($data['mileage_correction_reason'] ?? ''));

                $isAdmin = $currentUser && $currentUser->isAdmin();

                if (! $isAdmin || ! $allowLower || strlen($reason) < 10) {
                    throw ValidationException::withMessages([
                        'entry_mileage' => [
                            "El kilometraje de entrada ({$entryMileage} km) no puede ser inferior al último registrado en el vehículo ({$vehicle->current_mileage} km) sin autorización administrativa debidamente justificada.",
                        ],
                    ]);
                }
            }

            // Actualiza kilometraje del vehículo si es mayor
            if ($entryMileage > $vehicle->current_mileage) {
                $vehicle->update(['current_mileage' => $entryMileage]);
            }

            // Genera correlativo atómico con bloqueo pesimista
            $orderNumber = $this->generateNextOrderNumber();

            $order = Order::create([
                'order_number' => $orderNumber,
                'vehicle_id' => $vehicle->id,
                'client_id' => $data['client_id'] ?? $vehicle->client_id,
                'entry_mileage' => $entryMileage,
                'reported_issue' => $data['reported_issue'],
                'preliminary_diagnosis' => $data['preliminary_diagnosis'] ?? null,
                'status' => OrderStatus::PENDIENTE,
                'subtotal' => 0.00,
                'tax' => 0.00,
                'total' => 0.00,
                'entry_at' => now(),
            ]);

            // Bitácora inmutable de apertura
            OrderStatusHistory::create([
                'order_id' => $order->id,
                'user_id' => $currentUser?->id,
                'previous_status' => null,
                'new_status' => OrderStatus::PENDIENTE->value,
                'reason' => 'Apertura de orden de servicio e ingreso a recepción.',
            ]);

            $this->auditService->log(
                entityType: 'Order',
                entityId: $order->id,
                action: 'opened',
                previousValues: null,
                newValues: $order->toArray(),
                userId: $currentUser?->id
            );

            return $order;
        });
    }

    /**
     * Agrega un servicio a la orden copiando el precio unitario como snapshot inmutable (RF-4.2, CA-4.2.1).
     *
     * @param  array<string, mixed>  $data
     */
    public function addService(Order $order, array $data, ?User $currentUser = null): OrderService
    {
        $this->ensureNotReadOnly($order);

        $service = Service::findOrFail($data['service_id']);

        // Regla PT-006: Bloqueo de servicios inactivos en nuevas órdenes
        if ($service->status !== 'Activo') {
            throw ValidationException::withMessages([
                'service_id' => ['El servicio seleccionado se encuentra inactivo y no puede cargarse a la orden.'],
            ]);
        }

        $quantity = (int) ($data['quantity'] ?? 1);
        if ($quantity < 1) {
            throw ValidationException::withMessages([
                'quantity' => ['La cantidad debe ser mayor o igual a 1.'],
            ]);
        }

        return DB::transaction(function () use ($order, $service, $quantity, $data, $currentUser) {
            $unitPrice = (float) $service->base_price;
            $lineSubtotal = round($unitPrice * $quantity, 2);

            $orderService = OrderService::create([
                'order_id' => $order->id,
                'service_id' => $service->id,
                'service_name' => $service->name,
                'unit_price' => number_format($unitPrice, 2, '.', ''),
                'quantity' => $quantity,
                'subtotal' => number_format($lineSubtotal, 2, '.', ''),
                'notes' => $data['notes'] ?? null,
            ]);

            $this->recalculateTotals($order);

            $this->auditService->log(
                entityType: 'OrderService',
                entityId: $orderService->id,
                action: 'added_to_order',
                previousValues: null,
                newValues: $orderService->toArray(),
                userId: $currentUser?->id
            );

            return $orderService;
        });
    }

    /**
     * Elimina una línea de servicio y recalcula los totales.
     */
    public function removeService(Order $order, OrderService $orderService, ?User $currentUser = null): bool
    {
        $this->ensureNotReadOnly($order);

        if ($orderService->order_id !== $order->id) {
            throw ValidationException::withMessages([
                'service' => ['La línea de servicio no pertenece a esta orden.'],
            ]);
        }

        return DB::transaction(function () use ($order, $orderService, $currentUser) {
            $prev = $orderService->toArray();
            $orderService->delete();

            $this->recalculateTotals($order);

            $this->auditService->log(
                entityType: 'OrderService',
                entityId: $orderService->id,
                action: 'removed_from_order',
                previousValues: $prev,
                newValues: null,
                userId: $currentUser?->id
            );

            return true;
        });
    }

    /**
     * Asigna un mecánico a la orden previniendo duplicados e inactivos (RF-3.2, CA-3.2.2, PT-004, PT-005).
     *
     * @param  array<string, mixed>  $data
     */
    public function assignMechanic(Order $order, array $data, ?User $currentUser = null): void
    {
        $this->ensureNotReadOnly($order);

        $mechanic = Mechanic::findOrFail($data['mechanic_id']);

        // Regla PT-004: Rechazo de asignación de mecánicos con estado "Inactivo"
        if ($mechanic->status !== 'Activo') {
            throw ValidationException::withMessages([
                'mechanic_id' => ['El mecánico seleccionado se encuentra inactivo y no puede ser asignado a la orden.'],
            ]);
        }

        // Regla PT-005: Prevención de asignación duplicada del mismo mecánico a una misma orden
        $alreadyAssigned = $order->mechanics()
            ->where('mechanics.id', $mechanic->id)
            ->exists();

        if ($alreadyAssigned) {
            throw ValidationException::withMessages([
                'mechanic_id' => ['El mecánico ya se encuentra asignado a esta orden de servicio.'],
            ]);
        }

        DB::transaction(function () use ($order, $mechanic, $data, $currentUser) {
            $order->mechanics()->attach($mechanic->id, [
                'assigned_at' => now(),
                'notes' => $data['notes'] ?? null,
            ]);

            $this->auditService->log(
                entityType: 'OrderMechanic',
                entityId: $order->id,
                action: 'mechanic_assigned',
                previousValues: null,
                newValues: ['order_id' => $order->id, 'mechanic_id' => $mechanic->id],
                userId: $currentUser?->id
            );
        });
    }

    /**
     * Desvincula un mecánico de la orden.
     */
    public function unassignMechanic(Order $order, Mechanic $mechanic, ?User $currentUser = null): void
    {
        $this->ensureNotReadOnly($order);

        DB::transaction(function () use ($order, $mechanic, $currentUser) {
            $order->mechanics()->detach($mechanic->id);

            $this->auditService->log(
                entityType: 'OrderMechanic',
                entityId: $order->id,
                action: 'mechanic_unassigned',
                previousValues: ['order_id' => $order->id, 'mechanic_id' => $mechanic->id],
                newValues: null,
                userId: $currentUser?->id
            );
        });
    }

    /**
     * Ejecuta una transición ordinaria de estado verificando invariantes y reglas de negocio.
     */
    public function transitionStatus(Order $order, OrderStatus $targetStatus, ?string $reason = null, ?User $currentUser = null): Order
    {
        $this->ensureNotReadOnly($order);

        $currentStatus = $order->status;

        if ($currentStatus === $targetStatus) {
            return $order;
        }

        // Regla RF-5.2 y CA-5.2.1: Pasar a EN_REPARACION exige al menos 1 servicio y 1 mecánico activo
        if ($targetStatus === OrderStatus::EN_REPARACION) {
            $this->validatePreconditionsForRepair($order);
        }

        // Regla: Pasar a FINALIZADA estampa finished_at
        $finishedAt = ($targetStatus === OrderStatus::FINALIZADA) ? now() : $order->finished_at;

        // Entrega tiene su propio método dedicado por regla estricta PT-008
        if ($targetStatus === OrderStatus::ENTREGADA) {
            return $this->deliverOrder($order, $currentUser);
        }

        // Cancelación tiene su método dedicado por regla de motivo y responsable PT-010
        if ($targetStatus === OrderStatus::CANCELADA) {
            return $this->cancelOrder($order, $reason ?? 'Cancelación de orden solicitada.', $currentUser);
        }

        // Valida transiciones permitidas según máquina de estados finita
        $this->validateAllowedTransition($currentStatus, $targetStatus);

        return DB::transaction(function () use ($order, $currentStatus, $targetStatus, $finishedAt, $reason, $currentUser) {
            $prev = $order->toArray();

            $order->update([
                'status' => $targetStatus,
                'finished_at' => $finishedAt,
            ]);

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'user_id' => $currentUser?->id,
                'previous_status' => $currentStatus->value,
                'new_status' => $targetStatus->value,
                'reason' => $reason ?? "Transición operativa a estado {$targetStatus->label()}.",
            ]);

            $this->auditService->log(
                entityType: 'Order',
                entityId: $order->id,
                action: 'status_transition',
                previousValues: $prev,
                newValues: $order->fresh()->toArray(),
                userId: $currentUser?->id
            );

            return $order;
        });
    }

    /**
     * Entrega formal del vehículo al cliente (RF-5.3, CA-5.3.2, CA-5.3.3, PT-008, PT-009).
     *
     * Reglas estrictas:
     * - RECHAZA CON HTTP 422 si la orden no está en estado FINALIZADA.
     * - Una vez entregada, pasa a solo lectura y queda bloqueada para edición ordinaria.
     */
    public function deliverOrder(Order $order, ?User $currentUser = null, ?string $notes = null): Order
    {
        $this->ensureNotReadOnly($order);

        // Regla PT-008: Rechazo de transición a "Entregada" si la orden no está en "Finalizada"
        if ($order->status !== OrderStatus::FINALIZADA) {
            throw ValidationException::withMessages([
                'status' => [
                    'No se puede entregar una orden que no haya alcanzado previamente el estado Finalizada (estado actual: ' . $order->status->label() . ').',
                ],
            ]);
        }

        return DB::transaction(function () use ($order, $currentUser, $notes) {
            $prev = $order->toArray();

            $order->update([
                'status' => OrderStatus::ENTREGADA,
                'delivered_at' => now(),
            ]);

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'user_id' => $currentUser?->id,
                'previous_status' => OrderStatus::FINALIZADA->value,
                'new_status' => OrderStatus::ENTREGADA->value,
                'reason' => $notes ?? 'Entrega formal del vehículo al cliente tras verificación final.',
            ]);

            $this->auditService->log(
                entityType: 'Order',
                entityId: $order->id,
                action: 'delivered',
                previousValues: $prev,
                newValues: $order->fresh()->toArray(),
                userId: $currentUser?->id
            );

            return $order;
        });
    }

    /**
     * Cancelación formal de una orden con motivo justificado y usuario responsable (RF-5.3, CA-5.3.1, PT-010).
     *
     * Reglas:
     * - Solo permitida desde estados previos a FINALIZADA.
     * - Motivo de cancelación obligatorio (mínimo 5 caracteres).
     * - Registra responsable y timestamp.
     */
    public function cancelOrder(Order $order, string $reason, ?User $currentUser = null): Order
    {
        $this->ensureNotReadOnly($order);

        // Regla: Cancelación solo desde estados previos a FINALIZADA
        if (in_array($order->status, [OrderStatus::FINALIZADA, OrderStatus::ENTREGADA], true)) {
            throw ValidationException::withMessages([
                'status' => [
                    'No se puede cancelar una orden que ya ha sido ' . $order->status->label() . '.',
                ],
            ]);
        }

        $trimmedReason = trim($reason);
        if (strlen($trimmedReason) < 5) {
            throw ValidationException::withMessages([
                'cancellation_reason' => ['Debe suministrar un motivo justificado para cancelar la orden (mínimo 5 caracteres).'],
            ]);
        }

        return DB::transaction(function () use ($order, $trimmedReason, $currentUser) {
            $prev = $order->toArray();
            $previousStatus = $order->status->value;

            $order->update([
                'status' => OrderStatus::CANCELADA,
                'cancellation_reason' => $trimmedReason,
                'cancelled_by_user_id' => $currentUser?->id,
                'cancelled_at' => now(),
            ]);

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'user_id' => $currentUser?->id,
                'previous_status' => $previousStatus,
                'new_status' => OrderStatus::CANCELADA->value,
                'reason' => $trimmedReason,
            ]);

            $this->auditService->log(
                entityType: 'Order',
                entityId: $order->id,
                action: 'cancelled',
                previousValues: $prev,
                newValues: $order->fresh()->toArray(),
                userId: $currentUser?->id
            );

            return $order;
        });
    }

    /**
     * Verifica que la orden no esté en estado ENTREGADA (Solo lectura) ni CANCELADA.
     */
    public function ensureNotReadOnly(Order $order): void
    {
        if ($order->status === OrderStatus::ENTREGADA) {
            throw ValidationException::withMessages([
                'order' => ['La orden se encuentra en estado Entregada y es de solo lectura. No admite modificaciones operativas.'],
            ]);
        }

        if ($order->status === OrderStatus::CANCELADA) {
            throw ValidationException::withMessages([
                'order' => ['La orden se encuentra Cancelada y no admite modificaciones operativas.'],
            ]);
        }
    }

    /**
     * Valida precondiciones operativas para pasar a EN_REPARACION (RF-5.2, CA-5.2.1).
     */
    protected function validatePreconditionsForRepair(Order $order): void
    {
        // 1. Debe tener al menos un servicio cargado
        $servicesCount = $order->orderServices()->count();
        if ($servicesCount === 0) {
            throw ValidationException::withMessages([
                'services' => ['Debe cargar al menos un servicio antes de pasar la orden a estado En Reparación.'],
            ]);
        }

        // 2. Debe tener al menos un mecánico activo asignado
        $activeMechanicsCount = $order->mechanics()
            ->where('mechanics.status', 'Activo')
            ->count();

        if ($activeMechanicsCount === 0) {
            throw ValidationException::withMessages([
                'mechanics' => ['Debe asignar al menos un mecánico activo antes de enviar la orden a reparación.'],
            ]);
        }
    }

    /**
     * Valida las transiciones válidas según el grafo de la máquina de estados finita.
     */
    protected function validateAllowedTransition(OrderStatus $current, OrderStatus $target): void
    {
        $allowedTransitions = [
            OrderStatus::PENDIENTE->value => [OrderStatus::EN_DIAGNOSTICO, OrderStatus::EN_REPARACION],
            OrderStatus::EN_DIAGNOSTICO->value => [OrderStatus::EN_REPARACION, OrderStatus::EN_ESPERA_APROBACION],
            OrderStatus::EN_REPARACION->value => [OrderStatus::EN_ESPERA_APROBACION, OrderStatus::FINALIZADA],
            OrderStatus::EN_ESPERA_APROBACION->value => [OrderStatus::EN_REPARACION, OrderStatus::FINALIZADA],
            OrderStatus::FINALIZADA->value => [OrderStatus::ENTREGADA],
        ];

        $allowed = $allowedTransitions[$current->value] ?? [];

        if (! in_array($target, $allowed, true)) {
            throw ValidationException::withMessages([
                'status' => [
                    "Transición no permitida: no se puede pasar directamente de {$current->label()} a {$target->label()}.",
                ],
            ]);
        }
    }

    /**
     * Recalcula automáticamente el subtotal, impuesto y total de la orden (RF-5.4).
     */
    public function recalculateTotals(Order $order): void
    {
        $subtotal = (float) $order->orderServices()->sum('subtotal');
        $taxRate = 0.00; // Impuestos configurables; base 0.00 en módulo base
        $tax = round($subtotal * $taxRate, 2);
        $total = $subtotal + $tax;

        $order->update([
            'subtotal' => number_format($subtotal, 2, '.', ''),
            'tax' => number_format($tax, 2, '.', ''),
            'total' => number_format($total, 2, '.', ''),
        ]);
    }

    /**
     * Generación atómica de folio único secuencial (ORD-YYYY-XXXX) con control de concurrencia.
     */
    protected function generateNextOrderNumber(): string
    {
        $year = date('Y');
        $prefix = "ORD-{$year}-";

        // Consulta el último folio del año corriente
        $lastOrder = Order::where('order_number', 'like', "{$prefix}%")
            ->orderBy('id', 'desc')
            ->lockForUpdate()
            ->first();

        $nextSequence = 1;
        if ($lastOrder && preg_match("/ORD-{$year}-(\\d+)/", $lastOrder->order_number, $matches)) {
            $nextSequence = ((int) $matches[1]) + 1;
        }

        return sprintf('%s%04d', $prefix, $nextSequence);
    }
}
