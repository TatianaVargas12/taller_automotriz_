<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ResetPasswordWithCodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'identifier' => ['required', 'string', 'max:150'],
            'reset_token' => ['required', 'string'],
            'password' => [
                'required',
                'string',
                'min:8',
                'regex:/[A-Z]/',      // Al menos una mayúscula
                'regex:/[0-9]/',      // Al menos un número
                'regex:/[@$!%*?&#]/', // Al menos un símbolo
            ],
            'password_confirmation' => ['required', 'same:password'],
        ];
    }

    public function messages(): array
    {
        return [
            'identifier.required' => 'El identificador de cuenta es obligatorio.',
            'reset_token.required' => 'El token o código de autorización es obligatorio.',
            'password.required' => 'La nueva contraseña es obligatoria.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'password.regex' => 'La contraseña debe contener al menos una mayúscula, un número y un símbolo especial (@$!%*?&#).',
            'password_confirmation.required' => 'Debes confirmar tu nueva contraseña.',
            'password_confirmation.same' => 'La confirmación de la contraseña no coincide con la nueva contraseña.',
        ];
    }
}
