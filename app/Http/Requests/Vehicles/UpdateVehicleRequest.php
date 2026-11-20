<?php

declare(strict_types=1);

namespace App\Http\Requests\Vehicles;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateVehicleRequest extends FormRequest
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
            'client_id' => ['sometimes', 'required', 'integer', 'exists:clients,id'],
            'plate' => ['sometimes', 'required', 'string', 'max:15'],
            'brand' => ['sometimes', 'required', 'string', 'max:60'],
            'model' => ['sometimes', 'required', 'string', 'max:60'],
            'year' => ['sometimes', 'required', 'integer', 'min:1950', 'max:' . ($currentYear + 2)],
            'color' => ['nullable', 'string', 'max:40'],
            'type' => ['nullable', 'string', 'max:40'],
            'vin' => ['nullable', 'string', 'max:30'],
            'current_mileage' => ['sometimes', 'required', 'integer', 'min:0'],
            'allow_lower_mileage' => ['nullable', 'boolean'],
            'mileage_correction_reason' => ['nullable', 'string', 'max:500'],
            'status' => ['sometimes', 'required', 'string', Rule::in(['Activo', 'Inactivo'])],
        ];
    }
}
