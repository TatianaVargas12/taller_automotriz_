<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tabla 6 de 13: mechanics (Personal técnico del taller).
     *
     * Reglas de integridad clave:
     * - Documento único por mecánico: UNIQUE(document_number) (PRD CA-3.1.1, TRD Sección 2).
     * - Vínculo opcional 1:1 hacia users(id): UNIQUE(user_id) con ON DELETE SET NULL.
     */
    public function up(): void
    {
        Schema::create('mechanics', function (Blueprint $table) {
            $table->engine = 'InnoDB';

            $table->id();
            $table->foreignId('user_id')
                ->nullable()
                ->unique('mechanics_user_id_unique')
                ->constrained('users')
                ->nullOnDelete()
                ->comment('Usuario del sistema asociado para login móvil/web. Opcional 1:1');
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('document_number', 50)->unique('mechanics_document_number_unique');
            $table->string('phone', 50)->index('mechanics_phone_index');
            $table->string('email', 150)->nullable();
            $table->string('specialty', 100)->nullable()->comment('Especialidad técnica: Motores, Frenos, Electricidad, Suspensión');
            $table->string('status', 20)->default('active')->index('mechanics_status_index')->comment('active o inactive');
            $table->timestamps();

            $table->index(['last_name', 'first_name'], 'mechanics_full_name_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mechanics');
    }
};
