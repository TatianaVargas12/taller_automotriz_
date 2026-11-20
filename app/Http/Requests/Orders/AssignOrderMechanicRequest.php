<?php

declare(strict_types=1);

namespace App\Http\Requests\Orders;

use Illuminate\Foundation\Http\FormRequest;

class AssignOrderMechanicRequest extends FormRequest
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
            'mechanic_id' => ['required', 'integer', 'exists:mechanics,id'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'mechanic_id.required' => 'Debe seleccionar un mecánico para asignar a la orden.',
            'mechanic_id.exists' => 'El mecánico seleccionado no existe en el sistema.',
        ];
    }
}
