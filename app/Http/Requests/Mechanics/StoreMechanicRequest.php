<?php

declare(strict_types=1);

namespace App\Http\Requests\Mechanics;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMechanicRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'document_number' => ['required', 'string', 'max:30'],
            'phone' => ['required', 'string', 'max:20'],
            'email' => ['nullable', 'string', 'email:rfc,filter', 'max:150'],
            'specialty' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', Rule::in(['Activo', 'Inactivo'])],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'first_name.required' => 'Los nombres del mecánico son obligatorios.',
            'last_name.required' => 'Los apellidos del mecánico son obligatorios.',
            'document_number.required' => 'El documento de identidad del mecánico es obligatorio.',
            'phone.required' => 'El teléfono del mecánico es obligatorio.',
        ];
    }
}
