<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Estados del ciclo de vida de una Orden de Servicio.
 *
 * Máquina de estados finita definida en PRD (RF-5.3) y TRD (Sección 2):
 * PENDIENTE -> EN_DIAGNOSTICO -> EN_REPARACION <-> EN_ESPERA_APROBACION -> FINALIZADA -> ENTREGADA
 * Cancelación permitida desde cualquier estado previo a FINALIZADA (requiere motivo y responsable).
 */
enum OrderStatus: string
{
    case PENDIENTE = 'PENDIENTE';
    case EN_DIAGNOSTICO = 'EN_DIAGNOSTICO';
    case EN_REPARACION = 'EN_REPARACION';
    case EN_ESPERA_APROBACION = 'EN_ESPERA_APROBACION';
    case FINALIZADA = 'FINALIZADA';
    case ENTREGADA = 'ENTREGADA';
    case CANCELADA = 'CANCELADA';

    /**
     * Retorna una etiqueta amigable para la interfaz de usuario.
     */
    public function label(): string
    {
        return match ($this) {
            self::PENDIENTE => 'Pendiente',
            self::EN_DIAGNOSTICO => 'En Diagnóstico',
            self::EN_REPARACION => 'En Reparación',
            self::EN_ESPERA_APROBACION => 'En Espera de Aprobación',
            self::FINALIZADA => 'Finalizada',
            self::ENTREGADA => 'Entregada',
            self::CANCELADA => 'Cancelada',
        };
    }

    /**
     * Determina si la orden se encuentra en un estado terminal de solo lectura.
     */
    public function isTerminal(): bool
    {
        return in_array($this, [self::ENTREGADA, self::CANCELADA], true);
    }

    /**
     * Determina si la orden puede pasar al estado ENTREGADA.
     * Regla PRD CA-5.3.3: Solo puede entregarse una orden que haya alcanzado FINALIZADA.
     */
    public function canBeDelivered(): bool
    {
        return $this === self::FINALIZADA;
    }

    /**
     * Determina si la orden puede ser cancelada.
     * Regla PRD RF-5.3: Cancelable desde cualquier estado previo a FINALIZADA.
     */
    public function canBeCancelled(): bool
    {
        return !in_array($this, [self::FINALIZADA, self::ENTREGADA, self::CANCELADA], true);
    }

    /**
     * Array de todos los valores del enum para validación en base de datos.
     *
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
