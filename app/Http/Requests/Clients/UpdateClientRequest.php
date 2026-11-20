<?php

declare(strict_types=1);

namespace App\Http\Requests\Clients;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClientRequest extends FormRequest
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
            'first_name' => ['sometimes', 'required', 'string', 'max:100'],
            'last_name' => ['sometimes', 'required', 'string', 'max:100'],
            'document_type' => ['sometimes', 'required', 'string', Rule::in(['CC', 'CE', 'NIT', 'PASAPORTE', 'DNI'])],
            'document_number' => ['sometimes', 'required', 'string', 'max:30'],
            'phone' => ['sometimes', 'required', 'string', 'max:20'],
            'email' => ['nullable', 'string', 'email:rfc,filter', 'max:150'],
            'address' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'required', 'string', Rule::in(['Activo', 'Inactivo'])],
        ];
    }
}
