<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo OrderMechanic (Vínculo técnico asignado a orden de servicio).
 * Restricción UNIQUE(order_id, mechanic_id).
 *
 * @property int $id
 * @property int $order_id
 * @property int $mechanic_id
 * @property \Illuminate\Support\Carbon $assigned_at
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class OrderMechanic extends Model
{
    use HasFactory;

    protected $table = 'order_mechanic';

    protected $fillable = [
        'order_id',
        'mechanic_id',
        'assigned_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'assigned_at' => 'datetime',
        ];
    }

    /**
     * Orden asignada.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    /**
     * Mecánico asignado.
     */
    public function mechanic(): BelongsTo
    {
        return $this->belongsTo(Mechanic::class, 'mechanic_id');
    }
}
