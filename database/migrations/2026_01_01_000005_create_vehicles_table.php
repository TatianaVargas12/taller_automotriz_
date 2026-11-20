<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tabla 5 de 13: vehicles (Flota vehicular con soporte Soft Deletes).
     *
     * Reglas de integridad clave:
     * - Placa única por vehículo: UNIQUE(plate).
     * - Clave foránea client_id ON DELETE RESTRICT (no se elimina cliente con vehículos asociados).
     * - Kilometraje no negativo: current_mileage >= 0 (CHECK constraint en MySQL 8.4).
     */
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->engine = 'InnoDB';

            $table->id();
            $table->foreignId('client_id')
                ->constrained('clients')
                ->restrictOnDelete()
                ->comment('Propietario del vehículo. ON DELETE RESTRICT protege integridad histórica');
            $table->string('plate', 20)->unique('vehicles_plate_unique')->comment('Placa vehicular única');
            $table->string('brand', 100);
            $table->string('model', 100);
            $table->unsignedSmallInteger('year')->comment('Año del modelo');
            $table->string('color', 50)->nullable();
            $table->string('type', 50)->nullable()->comment('Ej. Sedán, SUV, Camioneta, Hatchback');
            $table->string('vin', 50)->nullable()->index('vehicles_vin_index')->comment('Número de chasis/VIN');
            $table->unsignedInteger('current_mileage')->default(0)->comment('Kilometraje actual en km, no negativo');
            $table->string('status', 20)->default('active')->index('vehicles_status_index');
            $table->timestamps();
            $table->softDeletes();

            // Índice compuesto para consultas de vehículos por cliente
            $table->index(['client_id', 'status'], 'vehicles_client_status_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
