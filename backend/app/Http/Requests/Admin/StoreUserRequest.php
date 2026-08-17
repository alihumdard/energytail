<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('users.add') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email:rfc', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:32'],

            // Optional: when omitted a random password is set and the user
            // signs in through the password reset flow.
            'password' => [
                'nullable',
                Password::min(8)->letters()->mixedCase()->numbers()->symbols(),
            ],

            // Unlike public registration, an administrator may assign any
            // role, including administrator.
            'role' => ['required', 'string', Rule::exists('roles', 'name')],

            'status' => ['sometimes', Rule::in(['active', 'suspended'])],
            'email_verified' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('email')) {
            $this->merge(['email' => mb_strtolower(trim((string) $this->input('email')))]);
        }
    }
}
