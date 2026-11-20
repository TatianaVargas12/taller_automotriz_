<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo OrderStatusHistory (Bitácora inmutable de transiciones de estado).
 *
 * @property int $id
 * @property int $order_id
 * @property int|null $user_id
 * @property string|null $previous_status
 * @property string $new_status
 * @property string|null $reason
 * @property \Illuminate\Support\Carbon $created_at
 */
class OrderStatusHistory extends Model
{
    use HasFactory;

    protected $table = 'order_status_history';

    // Inmutable: no cuenta con updated_at
    public $timestamps = false;

    protected $fillable = [
        'order_id',
        'user_id',
        'previous_status',
        'new_status',
        'reason',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'previous_status' => OrderStatus::class,
            'new_status' => OrderStatus::class,
            'created_at' => 'datetime',
        ];
    }

    /**
     * Orden sobre la cual ocurrió la transición.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    /**
     * Usuario que autorizó o ejecutó la transición.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
