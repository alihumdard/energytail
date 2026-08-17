<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Saves the whole permission matrix in one request.
 *
 * The admin screen has a single "Save Changes" button over a 10x7 grid, so
 * sending one request per checkbox would mean up to 70 round trips and could
 * leave the role half-updated if one failed.
 */
class SyncRolePermissionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('roles.edit') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // Present but empty means "revoke everything", which is a valid
            // action, so the array itself is required rather than filled.
            'permissions' => ['present', 'array'],
            'permissions.*' => ['string', Rule::exists('permissions', 'name')],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'permissions.present' => 'Send a permissions array, even if it is empty.',
            'permissions.*.exists' => 'One of the selected permissions does not exist.',
        ];
    }
}
