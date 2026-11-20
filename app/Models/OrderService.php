<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo OrderService (Línea de servicio individual en orden).
 * Congela precio y datos en el momento de creación (Snapshot inmutable).
 *
 * @property int $id
 * @property int $order_id
 * @property int $service_id
 * @property string $service_name
 * @property string $unit_price
 * @property int $quantity
 * @property string $subtotal
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class OrderService extends Model
{
    use HasFactory;

    protected $table = 'order_services';

    protected $fillable = [
        'order_id',
        'service_id',
        'service_name',
        'unit_price',
        'quantity',
        'subtotal',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price' => 'decimal:2',
            'subtotal' => 'decimal:2',
        ];
    }

    /**
     * Orden a la que pertenece la línea de servicio.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    /**
     * Servicio de catálogo origen (precios posteriores no afectan esta línea).
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class, 'service_id');
    }

    /**
     * Hook de arranque: calcula automáticamente el subtotal si no viene establecido.
     */
    protected static function booted(): void
    {
        static::saving(function (OrderService $item) {
            if (empty($item->subtotal)) {
                $item->subtotal = number_format(
                    ((float) $item->unit_price) * ((int) $item->quantity),
                    2,
                    '.',
                    ''
                );
            }
        });
    }
}
