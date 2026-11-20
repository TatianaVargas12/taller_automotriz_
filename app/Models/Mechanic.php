<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo Mechanic (Personal técnico del taller).
 *
 * @property int $id
 * @property int|null $user_id
 * @property string $first_name
 * @property string $last_name
 * @property string $document_number
 * @property string $phone
 * @property string|null $email
 * @property string|null $specialty
 * @property string $status
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class Mechanic extends Model
{
    use HasFactory;

    protected $table = 'mechanics';

    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'document_number',
        'phone',
        'email',
        'specialty',
        'status',
    ];

    /**
     * Nombre completo formateado del mecánico.
     */
    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    /**
     * Vínculo opcional 1:1 con cuenta de usuario.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Órdenes de servicio en las que participa el mecánico (N:M).
     */
    public function orders(): BelongsToMany
    {
        return $this->belongsToMany(Order::class, 'order_mechanic')
            ->withPivot('assigned_at', 'notes')
            ->withTimestamps();
    }

    /**
     * Registros individuales en tabla pivote order_mechanic.
     */
    public function orderMechanics(): HasMany
    {
        return $this->hasMany(OrderMechanic::class, 'mechanic_id');
    }

    /**
     * Scope para consultar solo mecánicos disponibles/activos.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
