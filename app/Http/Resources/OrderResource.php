<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'vehicle_id' => $this->vehicle_id,
            'client_id' => $this->client_id,
            'entry_mileage' => $this->entry_mileage,
            'reported_issue' => $this->reported_issue,
            'preliminary_diagnosis' => $this->preliminary_diagnosis,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'is_read_only' => $this->status->isReadOnly(),
            'is_terminal' => $this->status->isTerminal(),
            'cancellation_reason' => $this->cancellation_reason,
            'cancelled_by_user_id' => $this->cancelled_by_user_id,
            'cancelled_by' => $this->cancelledBy?->name,
            'subtotal' => (float) $this->subtotal,
            'tax' => (float) $this->tax,
            'total' => (float) $this->total,
            'entry_at' => $this->entry_at?->toISOString(),
            'finished_at' => $this->finished_at?->toISOString(),
            'delivered_at' => $this->delivered_at?->toISOString(),
            'cancelled_at' => $this->cancelled_at?->toISOString(),
            'vehicle' => new VehicleResource($this->whenLoaded('vehicle')),
            'client' => new ClientResource($this->whenLoaded('client')),
            'services' => OrderServiceResource::collection($this->whenLoaded('orderServices')),
            'mechanics' => MechanicResource::collection($this->whenLoaded('mechanics')),
            'status_history' => OrderStatusHistoryResource::collection($this->whenLoaded('statusHistory')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
