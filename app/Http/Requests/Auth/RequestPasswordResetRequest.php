<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RequestPasswordResetRequest extends FormRequest
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
                $channel === 'email' ? 'string' : 'regex:/^\+?[0-9\s\-]{8,20}$/',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'channel.required' => 'El canal de recuperación es obligatorio.',
            'channel.in' => 'El canal de recuperación debe ser email o phone.',
            'identifier.required' => 'El campo de correo electrónico, usuario o teléfono es obligatorio.',
            'identifier.regex' => 'El formato del número de teléfono es inválido.',
        ];
    }
}
