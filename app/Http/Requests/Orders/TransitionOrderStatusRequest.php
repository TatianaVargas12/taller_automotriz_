<?php

declare(strict_types=1);

namespace App\Http\Requests\Orders;

use App\Enums\OrderStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class TransitionOrderStatusRequest extends FormRequest
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
            'status' => ['required_without:to_status', 'nullable', new Enum(OrderStatus::class)],
            'to_status' => ['required_without:status', 'nullable', new Enum(OrderStatus::class)],
            'reason' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'status.required_without' => 'El nuevo estado de la orden es obligatorio.',
            'to_status.required_without' => 'El nuevo estado de la orden es obligatorio.',
        ];
    }
}
