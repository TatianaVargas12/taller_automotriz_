<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tabla 13 de 13: audit_logs (Trazabilidad y auditoría de operaciones críticas del sistema).
     *
     * Reglas de integridad clave:
     * - Almacena previous_values y new_values en formato JSON nativo (TRD Sección 2).
     * - Registra IP y agente para cumplimiento de Ley 1581 (Habeas Data) y control administrativo.
     */
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->engine = 'InnoDB';

            $table->id();
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->comment('Usuario autor de la acción');
            $table->string('entity_type', 100)->comment('Clase o tabla afectada ej. Order, Client, Vehicle');
            $table->unsignedBigInteger('entity_id')->nullable()->comment('ID de la entidad afectada');
            $table->string('action', 50)->comment('created, updated, deleted, status_changed, cancelled');
            $table->json('previous_values')->nullable()->comment('Estado previo de la entidad en JSON');
            $table->json('new_values')->nullable()->comment('Nuevo estado de la entidad en JSON');
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['entity_type', 'entity_id'], 'audit_logs_entity_index');
            $table->index(['created_at'], 'audit_logs_created_at_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
