<?php

declare(strict_types=1);

namespace App\Http\Requests\Vehicles;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreVehicleRequest extends FormRequest
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
        $currentYear = (int) date('Y');

        return [
            'client_id' => ['required', 'integer', 'exists:clients,id'],
            'plate' => ['required', 'string', 'max:15'],
            'brand' => ['required', 'string', 'max:60'],
            'model' => ['required', 'string', 'max:60'],
            'year' => ['required', 'integer', 'min:1950', 'max:' . ($currentYear + 2)],
            'color' => ['nullable', 'string', 'max:40'],
            'type' => ['nullable', 'string', 'max:40'],
            'vin' => ['nullable', 'string', 'max:30'],
            'current_mileage' => ['required', 'integer', 'min:0'],
            'status' => ['nullable', 'string', Rule::in(['Activo', 'Inactivo'])],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'client_id.required' => 'El propietario del vehículo es obligatorio.',
            'client_id.exists' => 'El cliente indicado no existe en el sistema.',
            'plate.required' => 'La placa vehicular es obligatoria.',
            'current_mileage.min' => 'El kilometraje debe ser un entero no negativo mayor o igual a cero.',
        ];
    }
}
