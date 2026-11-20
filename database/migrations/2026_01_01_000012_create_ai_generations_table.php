<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tabla 12 de 13: ai_generations (Historial y telemetría de generaciones del asistente de IA).
     *
     * Reglas de integridad clave:
     * - Almacena module_name, generation_type, generated_content (LONGTEXT / JSON) y telemetría de ejecución (TRD Sección 2).
     * - Desacoplado: el fallo o timeout de la IA se registra aquí sin congelar el core del taller.
     */
    public function up(): void
    {
        Schema::create('ai_generations', function (Blueprint $table) {
            $table->engine = 'InnoDB';

            $table->id();
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->comment('Administrador que solicitó la generación');
            $table->string('module_name', 50)->comment('Módulo consultado: clients, vehicles, mechanics, services, orders');
            $table->string('generation_type', 50)->comment('Tipo: user_story o technical_doc');
            $table->text('prompt')->comment('Prompt funcional sanitizado enviado al adaptador');
            $table->longText('generated_content')->nullable()->comment('Resultado Markdown / JSON generado');
            $table->string('provider', 50)->default('openai')->comment('Adaptador utilizado (openai, claude, gemini, etc.)');
            $table->string('model', 50)->nullable()->comment('Modelo de lenguaje específico');
            $table->unsignedInteger('execution_time_ms')->nullable()->comment('Tiempo de latencia en milisegundos');
            $table->unsignedInteger('tokens_used')->nullable()->comment('Consumo de tokens de la llamada');
            $table->string('status', 20)->default('success')->comment('success, failed o timeout');
            $table->text('error_message')->nullable()->comment('Detalle del error en caso de fallo');
            $table->timestamps();

            $table->index(['module_name', 'generation_type'], 'ai_gen_module_type_index');
            $table->index(['created_at'], 'ai_gen_created_at_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_generations');
    }
};
