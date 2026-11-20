<?php

declare(strict_types=1);

use App\Enums\OrderStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tabla 8 de 13: orders (Órdenes de Servicio - Entidad central del taller).
     *
     * Reglas de integridad clave:
     * - Numeración de orden secuencial y única: UNIQUE(order_number).
     * - Clave foránea vehicle_id ON DELETE RESTRICT (no se borra vehículo con órdenes).
     * - Kilometraje de entrada no negativo: entry_mileage >= 0.
     * - Montos totales en DECIMAL(12, 2).
     * - Máquina de estados tipada: PENDIENTE, EN_DIAGNOSTICO, EN_REPARACION, EN_ESPERA_APROBACION, FINALIZADA, ENTREGADA, CANCELADA.
     * - Cancelación con motivo y usuario responsable (cancelled_by_user_id).
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->engine = 'InnoDB';

            $table->id();
            $table->string('order_number', 50)->unique('orders_order_number_unique')->comment('Folio secuencial único ej. ORD-2026-0001');
            $table->foreignId('vehicle_id')
                ->constrained('vehicles')
                ->restrictOnDelete()
                ->comment('Vehículo intervenido. ON DELETE RESTRICT protege la trazabilidad');
            $table->foreignId('client_id')
                ->nullable()
                ->constrained('clients')
                ->restrictOnDelete()
                ->comment('Cliente titular en el momento de la apertura');
            $table->unsignedInteger('entry_mileage')->comment('Kilometraje al momento de recepción');
            $table->text('reported_issue')->comment('Problema manifestado por el cliente');
            $table->text('preliminary_diagnosis')->nullable()->comment('Diagnóstico preliminar en recepción');
            $table->string('status', 30)->default(OrderStatus::PENDIENTE->value)->index('orders_status_index');
            
            // Auditoría de cancelación obligatoria por PRD CA-5.3.1
            $table->text('cancellation_reason')->nullable();
            $table->foreignId('cancelled_by_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->comment('Usuario que autorizó la cancelación');
            
            // Snapshot financiero acumulado en DECIMAL(12, 2)
            $table->decimal('subtotal', 12, 2)->default(0.00);
            $table->decimal('tax', 12, 2)->default(0.00);
            $table->decimal('total', 12, 2)->default(0.00);

            // Trazabilidad temporal de hitos operativos
            $table->timestamp('entry_at')->useCurrent()->comment('Fecha y hora de ingreso del vehículo');
            $table->timestamp('finished_at')->nullable()->comment('Fecha y hora en que pasó a FINALIZADA');
            $table->timestamp('delivered_at')->nullable()->comment('Fecha y hora de entrega física al cliente');
            $table->timestamp('cancelled_at')->nullable()->comment('Fecha y hora de cancelación');
            $table->timestamps();

            // Índices para consultas operativas frecuentes
            $table->index(['vehicle_id', 'status'], 'orders_vehicle_status_index');
            $table->index(['client_id', 'status'], 'orders_client_status_index');
            $table->index(['entry_at'], 'orders_entry_at_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
