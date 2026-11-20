<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Modelo Client (Propietarios y contactos del taller).
 *
 * @property int $id
 * @property string $first_name
 * @property string $last_name
 * @property string $document_type
 * @property string $document_number
 * @property string $phone
 * @property string|null $email
 * @property string|null $address
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class Client extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'clients';

    protected $fillable = [
        'first_name',
        'last_name',
        'document_type',
        'document_number',
        'phone',
        'email',
        'address',
        'status',
    ];

    /**
     * Nombre completo formateado del cliente.
     */
    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    /**
     * Vehículos pertenecientes a este cliente (Relación 1:N).
     */
    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class, 'client_id');
    }

    /**
     * Órdenes de servicio vinculadas a los vehículos de este cliente.
     */
    public function orders(): HasManyThrough
    {
        return $this->hasManyThrough(
            Order::class,
            Vehicle::class,
            'client_id',  // FK en tabla vehicles
            'vehicle_id', // FK en tabla orders
            'id',         // Local key en tabla clients
            'id'          // Local key en tabla vehicles
        );
    }
}
