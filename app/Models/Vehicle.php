<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Modelo Vehicle (Flota de vehículos atendidos).
 *
 * @property int $id
 * @property int $client_id
 * @property string $plate
 * @property string $brand
 * @property string $model
 * @property int $year
 * @property string|null $color
 * @property string|null $type
 * @property string|null $vin
 * @property int $current_mileage
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class Vehicle extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'vehicles';

    protected $fillable = [
        'client_id',
        'plate',
        'brand',
        'model',
        'year',
        'color',
        'type',
        'vin',
        'current_mileage',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'current_mileage' => 'integer',
        ];
    }

    /**
     * Cliente propietario del vehículo (Relación N:1).
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    /**
     * Historial de órdenes de servicio de este vehículo (Relación 1:N).
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'vehicle_id');
    }

    /**
     * Obtiene el último kilometraje registrado en órdenes de servicio.
     */
    public function getLatestRecordedMileage(): int
    {
        $lastOrderMileage = $this->orders()
            ->max('entry_mileage');

        return max((int) $lastOrderMileage, (int) $this->current_mileage);
    }
}
