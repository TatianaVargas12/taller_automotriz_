<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tabla 7 de 13: services (Catálogo de mano de obra y operaciones del taller).
     *
     * Reglas de integridad clave:
     * - Precios base en DECIMAL(12, 2) >= 0.
     * - Soporte de Soft Deletes para desactivación lógica sin romper historial de órdenes previas.
     */
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->engine = 'InnoDB';

            $table->id();
            $table->string('name', 150)->index('services_name_index');
            $table->text('description')->nullable();
            $table->string('category', 100)->nullable()->index('services_category_index')->comment('Ej. Mantenimiento, Frenos, Motor, Diagnóstico');
            $table->decimal('base_price', 12, 2)->default(0.00)->comment('Tarifa base vigente. No altera órdenes ya creadas');
            $table->string('status', 20)->default('active')->index('services_status_index');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
