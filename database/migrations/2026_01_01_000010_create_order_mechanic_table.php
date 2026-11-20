<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tabla 10 de 13: order_mechanic (Asignación de mecánicos a órdenes de servicio).
     *
     * Reglas de integridad clave:
     * - Restricción UNIQUE(order_id, mechanic_id) obligatoria por TRD Sección 2 y PRD PT-005.
     *   Previene a nivel de motor de base de datos la duplicidad del mismo mecánico en la misma orden.
     * - FK order_id ON DELETE CASCADE.
     * - FK mechanic_id ON DELETE RESTRICT (no se borra mecánico con órdenes asignadas).
     */
    public function up(): void
    {
        Schema::create('order_mechanic', function (Blueprint $table) {
            $table->engine = 'InnoDB';

            $table->id();
            $table->foreignId('order_id')
                ->constrained('orders')
                ->cascadeOnDelete();
            $table->foreignId('mechanic_id')
                ->constrained('mechanics')
                ->restrictOnDelete();
            $table->timestamp('assigned_at')->useCurrent()->comment('Fecha y hora en que se vinculó el técnico');
            $table->text('notes')->nullable()->comment('Tareas o sección asignada al mecánico dentro de la orden');
            $table->timestamps();

            // Restricción única requerida por PRD CA-3.2.2 y TRD Sección 2:
            $table->unique(['order_id', 'mechanic_id'], 'order_mechanic_order_mech_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_mechanic');
    }
};
