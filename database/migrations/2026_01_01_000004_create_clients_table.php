<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tabla 4 de 13: clients (Módulo de Clientes con soporte Soft Deletes).
     *
     * Reglas de integridad clave:
     * - Documento único por tipo de cliente: UNIQUE(document_type, document_number).
     * - Soft deletes para conservar trazabilidad histórica de vehículos y órdenes previas.
     * - Índices para búsqueda rápida en tiempo real por documento, teléfono y apellidos (RF-1.2).
     */
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->engine = 'InnoDB';

            $table->id();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('document_type', 20)->comment('Tipo de documento: CC, CE, NIT, PP, TI');
            $table->string('document_number', 50)->comment('Número de documento de identidad');
            $table->string('phone', 50)->index('clients_phone_index');
            $table->string('email', 150)->nullable()->index('clients_email_index');
            $table->string('address', 255)->nullable();
            $table->string('status', 20)->default('active')->index('clients_status_index');
            $table->timestamps();
            $table->softDeletes();

            // Regla de integridad en BD requerida por PRD CA-1.1.2 y TRD Sección 2:
            $table->unique(['document_type', 'document_number'], 'clients_doc_type_number_unique');

            // Índice compuesto para acelerar búsquedas frecuentes por nombres y apellidos
            $table->index(['last_name', 'first_name'], 'clients_full_name_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
