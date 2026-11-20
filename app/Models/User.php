<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Modelo User (Identidad y Credenciales).
 *
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string $password
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $email_verified_at
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'users';

    protected $fillable = [
        'name',
        'email',
        'password',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Relación N:M con roles mediante la tabla pivote role_user.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_user')
            ->withTimestamps();
    }

    /**
     * Vínculo opcional 1:1 con perfil operativo de Mecánico.
     */
    public function mechanic(): HasOne
    {
        return $this->hasOne(Mechanic::class, 'user_id');
    }

    /**
     * Transiciones de orden registradas por este usuario.
     */
    public function statusHistory(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class, 'user_id');
    }

    /**
     * Peticiones generadas al Asistente de IA por este usuario.
     */
    public function aiGenerations(): HasMany
    {
        return $this->hasMany(AiGeneration::class, 'user_id');
    }

    /**
     * Logs de auditoría de operaciones realizadas por este usuario.
     */
    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'user_id');
    }

    /**
     * Comprueba si el usuario posee un rol específico por nombre o slug.
     */
    public function hasRole(string $role): bool
    {
        return $this->roles->contains(function (Role $r) use ($role) {
            return $r->slug === $role || $r->name === $role;
        });
    }

    /**
     * Helper para verificar rol de Administrador.
     */
    public function isAdmin(): bool
    {
        return $this->hasRole('admin') || $this->hasRole('Administrador');
    }

    /**
     * Helper para verificar rol de Recepcionista.
     */
    public function isReceptionist(): bool
    {
        return $this->hasRole('receptionist') || $this->hasRole('Recepcionista');
    }

    /**
     * Helper para verificar rol de Mecánico.
     */
    public function isMechanic(): bool
    {
        return $this->hasRole('mechanic') || $this->hasRole('Mecánico');
    }
}
