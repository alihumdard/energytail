<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('users.edit') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        // Route-model binding resolves {user} to a User, so this is always
        // the model rather than a raw id.
        $userId = $this->route('user')->id;

        return [
            'first_name' => ['sometimes', 'required', 'string', 'max:100'],
            'last_name' => ['sometimes', 'required', 'string', 'max:100'],
            'email' => [
                'sometimes', 'required', 'email:rfc', 'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'phone' => ['nullable', 'string', 'max:32'],
            'role' => ['sometimes', 'string', Rule::exists('roles', 'name')],
        ];
    }

    /**
     * Password changes are deliberately absent. An administrator setting
     * someone else's password would hand them a credential the account owner
     * never chose; the reset flow keeps that in the user's own hands.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('email')) {
            $this->merge(['email' => mb_strtolower(trim((string) $this->input('email')))]);
        }
    }
}
