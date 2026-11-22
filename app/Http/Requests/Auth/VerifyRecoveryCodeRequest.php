<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class VerifyRecoveryCodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'identifier' => ['required', 'string', 'max:150'],
            'code' => ['required', 'string', 'min:6', 'max:64'],
        ];
    }

    public function messages(): array
    {
        return [
            'identifier.required' => 'El identificador de cuenta es obligatorio.',
            'code.required' => 'El código de seguridad o token es obligatorio.',
            'code.min' => 'El código debe tener al menos 6 dígitos.',
        ];
    }
}
