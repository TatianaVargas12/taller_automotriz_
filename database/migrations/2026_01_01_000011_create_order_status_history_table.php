<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tabla 11 de 13: order_status_history (Bitácora inmutable de transiciones de estado de órdenes).
     *
     * Reglas de integridad clave:
     * - Registro de auditoría estricto de cada cambio de estado: quién lo hizo, cuándo, estado previo, nuevo estado y motivo.
     * - Inmutable: no cuenta con updated_at ya que nunca debe modificarse un registro histórico.
     */
    public function up(): void
    {
        Schema::create('order_status_history', function (Blueprint $table) {
            $table->engine = 'InnoDB';

            $table->id();
            $table->foreignId('order_id')
                ->constrained('orders')
                ->cascadeOnDelete();
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->comment('Usuario que ejecutó la transición de estado');
            $table->string('previous_status', 30)->nullable()->comment('Estado de origen');
            $table->string('new_status', 30)->comment('Nuevo estado alcanzado');
            $table->text('reason')->nullable()->comment('Justificación de cambio o motivo de cancelación');
            $table->timestamp('created_at')->useCurrent()->comment('Timestamp exacto de la transición inmutable');

            $table->index(['order_id', 'created_at'], 'order_status_hist_order_date_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_status_history');
    }
};
