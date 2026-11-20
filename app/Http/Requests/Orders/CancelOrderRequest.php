<?php

declare(strict_types=1);

namespace App\Http\Requests\Orders;

use Illuminate\Foundation\Http\FormRequest;

class CancelOrderRequest extends FormRequest
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
            'reason' => ['required_without:cancellation_reason', 'nullable', 'string', 'min:5', 'max:1000'],
            'cancellation_reason' => ['required_without:reason', 'nullable', 'string', 'min:5', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'reason.required_without' => 'Debe suministrar un motivo justificado para cancelar la orden.',
            'cancellation_reason.required_without' => 'Debe suministrar un motivo justificado para cancelar la orden.',
            'reason.min' => 'El motivo de cancelación debe tener al menos 5 caracteres.',
            'cancellation_reason.min' => 'El motivo de cancelación debe tener al menos 5 caracteres.',
        ];
    }
}
