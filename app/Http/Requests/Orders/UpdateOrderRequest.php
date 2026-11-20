<?php

declare(strict_types=1);

namespace App\Http\Requests\Orders;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderRequest extends FormRequest
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
            'reported_issue' => ['sometimes', 'required', 'string', 'min:5'],
            'preliminary_diagnosis' => ['nullable', 'string'],
        ];
    }
}
