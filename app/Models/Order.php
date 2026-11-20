<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo Order (Orden de Servicio - Entidad central del taller).
 *
 * @property int $id
 * @property string $order_number
 * @property int $vehicle_id
 * @property int|null $client_id
 * @property int $entry_mileage
 * @property string $reported_issue
 * @property string|null $preliminary_diagnosis
 * @property OrderStatus $status
 * @property string|null $cancellation_reason
 * @property int|null $cancelled_by_user_id
 * @property string $subtotal
 * @property string $tax
 * @property string $total
 * @property \Illuminate\Support\Carbon $entry_at
 * @property \Illuminate\Support\Carbon|null $finished_at
 * @property \Illuminate\Support\Carbon|null $delivered_at
 * @property \Illuminate\Support\Carbon|null $cancelled_at
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class Order extends Model
{
    use HasFactory;

    protected $table = 'orders';

    protected $fillable = [
        'order_number',
        'vehicle_id',
        'client_id',
        'entry_mileage',
        'reported_issue',
        'preliminary_diagnosis',
        'status',
        'cancellation_reason',
        'cancelled_by_user_id',
        'subtotal',
        'tax',
        'total',
        'entry_at',
        'finished_at',
        'delivered_at',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
            'entry_mileage' => 'integer',
            'subtotal' => 'decimal:2',
            'tax' => 'decimal:2',
            'total' => 'decimal:2',
            'entry_at' => 'datetime',
            'finished_at' => 'datetime',
            'delivered_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    /**
     * Vehículo asociado a la orden (N:1).
     */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id');
    }

    /**
     * Cliente titular de la orden (N:1).
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    /**
     * Usuario que autorizó la cancelación (N:1).
     */
    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by_user_id');
    }

    /**
     * Servicios cargados a la orden (N:M a través de order_services).
     */
    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Service::class, 'order_services')
            ->withPivot('service_name', 'unit_price', 'quantity', 'subtotal', 'notes')
            ->withTimestamps();
    }

    /**
     * Líneas de servicio detalladas de la orden.
     */
    public function orderServices(): HasMany
    {
        return $this->hasMany(OrderService::class, 'order_id');
    }

    /**
     * Mecánicos asignados a la orden (N:M a través de order_mechanic).
     */
    public function mechanics(): BelongsToMany
    {
        return $this->belongsToMany(Mechanic::class, 'order_mechanic')
            ->withPivot('assigned_at', 'notes')
            ->withTimestamps();
    }

    /**
     * Asignaciones directas en tabla pivote order_mechanic.
     */
    public function orderMechanics(): HasMany
    {
        return $this->hasMany(OrderMechanic::class, 'order_id');
    }

    /**
     * Bitácora inmutable de auditoría de transiciones de estado.
     */
    public function statusHistory(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class, 'order_id')
            ->orderBy('created_at', 'asc');
    }

    /**
     * Recalcula el subtotal y total de la orden a partir de las líneas de servicio cargadas.
     * Subtotal = SUM(quantity * unit_price).
     */
    public function recalculateTotals(): void
    {
        $calculatedSubtotal = $this->orderServices()
            ->sum('subtotal');

        $this->subtotal = number_format((float) $calculatedSubtotal, 2, '.', '');
        $this->tax = '0.00';
        $this->total = $this->subtotal;
        $this->save();
    }
}
