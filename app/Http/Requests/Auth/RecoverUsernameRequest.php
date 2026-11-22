<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RecoverUsernameRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $channel = $this->input('channel', 'email');

        return [
            'channel' => ['required', 'string', 'in:email,phone'],
            'identifier' => [
                'required',
                'string',
                'max:150',
                $channel === 'email' ? 'email:rfc,dns' : 'regex:/^\+?[0-9\s\-]{8,20}$/',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'channel.required' => 'El canal de recuperación es obligatorio.',
            'channel.in' => 'El canal debe ser correo electrónico (email) o número de teléfono (phone).',
            'identifier.required' => 'El campo de correo electrónico o número de teléfono es obligatorio.',
            'identifier.email' => 'Por favor introduce un formato de correo electrónico válido.',
            'identifier.regex' => 'Por favor introduce un formato de número de teléfono válido (ej. +34 612 345 678).',
        ];
    }
}
