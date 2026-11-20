<?php

declare(strict_types=1);

namespace App\Http\Requests\Clients;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreClientRequest extends FormRequest
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
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'document_type' => ['required', 'string', Rule::in(['CC', 'CE', 'NIT', 'PASAPORTE', 'DNI'])],
            'document_number' => ['required', 'string', 'max:30'],
            'phone' => ['required', 'string', 'max:20'],
            'email' => ['nullable', 'string', 'email:rfc,filter', 'max:150'],
            'address' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', Rule::in(['Activo', 'Inactivo'])],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'first_name.required' => 'Los nombres del cliente son obligatorios.',
            'last_name.required' => 'Los apellidos del cliente son obligatorios.',
            'document_type.required' => 'El tipo de documento es obligatorio.',
            'document_number.required' => 'El número de documento es obligatorio.',
            'phone.required' => 'El teléfono de contacto es obligatorio.',
            'email.email' => 'El correo electrónico provisto no cumple con el formato estándar RFC 5322.',
        ];
    }
}
