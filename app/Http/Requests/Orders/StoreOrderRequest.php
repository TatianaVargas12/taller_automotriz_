<?php

declare(strict_types=1);

namespace App\Http\Requests\Orders;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
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
            'vehicle_id' => ['required', 'integer', 'exists:vehicles,id'],
            'client_id' => ['nullable', 'integer', 'exists:clients,id'],
            'entry_mileage' => ['required', 'integer', 'min:0'],
            'reported_issue' => ['required', 'string', 'min:5'],
            'preliminary_diagnosis' => ['nullable', 'string'],
            'allow_lower_mileage' => ['nullable', 'boolean'],
            'mileage_correction_reason' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'vehicle_id.required' => 'Debe asociar un vehículo activo existente a la orden.',
            'vehicle_id.exists' => 'El vehículo indicado no existe en el sistema.',
            'entry_mileage.required' => 'El kilometraje de recepción es obligatorio.',
            'reported_issue.required' => 'Debe ingresar el problema reportado por el cliente.',
        ];
    }
}
