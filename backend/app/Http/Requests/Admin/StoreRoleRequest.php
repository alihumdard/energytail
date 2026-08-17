<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StoreRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('roles.add') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'label' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],

            // Machine key derived from the label, but validated here so a
            // caller supplying one directly cannot collide with a seeded role.
            'name' => [
                'nullable', 'string', 'max:100',
                'regex:/^[a-z0-9_]+$/',
                Rule::unique('roles', 'name'),
            ],

            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['string', Rule::exists('permissions', 'name')],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.regex' => 'The role key may contain only lowercase letters, numbers and underscores.',
            'permissions.*.exists' => 'One of the selected permissions does not exist.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if (! $this->filled('name') && $this->filled('label')) {
            $this->merge([
                'name' => Str::snake(Str::lower((string) $this->input('label'))),
            ]);
        }
    }
}
