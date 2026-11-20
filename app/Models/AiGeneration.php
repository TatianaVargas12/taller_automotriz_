<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo AiGeneration (Historial y telemetría de generaciones del asistente IA).
 *
 * @property int $id
 * @property int|null $user_id
 * @property string $module_name
 * @property string $generation_type
 * @property string $prompt
 * @property string|null $generated_content
 * @property string $provider
 * @property string|null $model
 * @property int|null $execution_time_ms
 * @property int|null $tokens_used
 * @property string $status
 * @property string|null $error_message
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class AiGeneration extends Model
{
    use HasFactory;

    protected $table = 'ai_generations';

    protected $fillable = [
        'user_id',
        'module_name',
        'generation_type',
        'prompt',
        'generated_content',
        'provider',
        'model',
        'execution_time_ms',
        'tokens_used',
        'status',
        'error_message',
    ];

    protected function casts(): array
    {
        return [
            'execution_time_ms' => 'integer',
            'tokens_used' => 'integer',
        ];
    }

    /**
     * Administrador que solicitó la generación técnica.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
