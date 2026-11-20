<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Modelo Service (Catálogo de operaciones y mano de obra).
 *
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property string|null $category
 * @property string $base_price
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class Service extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'services';

    protected $fillable = [
        'name',
        'description',
        'category',
        'base_price',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'base_price' => 'decimal:2',
        ];
    }

    /**
     * Órdenes que han incluido este servicio (N:M).
     */
    public function orders(): BelongsToMany
    {
        return $this->belongsToMany(Order::class, 'order_services')
            ->withPivot('service_name', 'unit_price', 'quantity', 'subtotal', 'notes')
            ->withTimestamps();
    }

    /**
     * Líneas de orden individuales vinculadas a este servicio.
     */
    public function orderServices(): HasMany
    {
        return $this->hasMany(OrderService::class, 'service_id');
    }

    /**
     * Scope para consultar únicamente servicios activos para nuevas órdenes.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
