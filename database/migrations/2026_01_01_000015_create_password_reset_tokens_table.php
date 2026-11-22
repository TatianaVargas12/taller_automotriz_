<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tabla para recuperación de cuentas y restablecimiento de contraseña.
     * Soporta canales de correo electrónico y teléfono (SMS) con caducidad y hashing seguro.
     */
    public function up(): void
    {
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->engine = 'InnoDB';

            $table->id();
            $table->string('identifier', 150)->index('pwd_reset_identifier_index')->comment('Correo electrónico o número de teléfono del usuario');
            $table->string('token', 64)->comment('Hash criptográfico SHA-256 del código SMS o token de reseteo');
            $table->string('channel', 20)->default('email')->comment('email o phone');
            $table->string('type', 20)->default('password')->comment('password o username');
            $table->unsignedTinyInteger('attempts')->default(0)->comment('Contador de intentos fallidos para mitigar fuerza bruta');
            $table->timestamp('expires_at')->comment('Fecha y hora límite de validez (15 minutos)');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['identifier', 'channel', 'expires_at'], 'pwd_reset_lookup_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('password_reset_tokens');
    }
};
