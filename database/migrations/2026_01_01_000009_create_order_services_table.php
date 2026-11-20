<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tabla 9 de 13: order_services (Líneas de servicio de la orden).
     *
     * Reglas de integridad clave:
     * - Snapshot inmutable de precio: unit_price y service_name se copian al momento de inserción.
     * - Subtotal = quantity * unit_price en DECIMAL(12, 2).
     * - Cambios posteriores al catálogo de servicios jamás alteran órdenes pasadas.
     * - FK order_id ON DELETE CASCADE.
     * - FK service_id ON DELETE RESTRICT (previene eliminar catálogo activo con referencias).
     */
    public function up(): void
    {
        Schema::create('order_services', function (Blueprint $table) {
            $table->engine = 'InnoDB';

            $table->id();
            $table->foreignId('order_id')
                ->constrained('orders')
                ->cascadeOnDelete();
            $table->foreignId('service_id')
                ->constrained('services')
                ->restrictOnDelete();
            $table->string('service_name', 150)->comment('Snapshot del nombre del servicio en el momento de cargarlo');
            $table->decimal('unit_price', 12, 2)->comment('Snapshot del precio unitario facturado (inmutable ante cambios de catálogo)');
            $table->unsignedInteger('quantity')->default(1)->comment('Cantidad de operaciones/unidades');
            $table->decimal('subtotal', 12, 2)->comment('Snapshot calculado: quantity * unit_price');
            $table->text('notes')->nullable()->comment('Observaciones técnicas específicas del trabajo ejecutado');
            $table->timestamps();

            $table->index(['order_id', 'service_id'], 'order_services_order_service_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_services');
    }
};
