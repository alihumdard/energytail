<?php

namespace App\Http\Resources;

use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Role
 */
class RoleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'label' => $this->label ?? $this->name,
            'description' => $this->description,
            'is_system' => $this->is_system,
            'sort_order' => $this->sort_order,

            // Counted with withCount() on the index so the listing does not
            // run a query per row.
            'users_count' => $this->whenCounted('users'),
            'permissions_count' => $this->whenCounted('permissions'),

            // Only loaded when the caller asked for the full matrix.
            'permissions' => $this->whenLoaded(
                'permissions',
                fn () => $this->permissions->pluck('name')
            ),

            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
