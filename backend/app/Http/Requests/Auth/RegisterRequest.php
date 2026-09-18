<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
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
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email:rfc', 'max:255', 'unique:users,email'],

            // Mirrors the rule printed on the register screen: at least 8
            // characters with uppercase, lowercase, number and symbol.
            'password' => [
                'required',
                'confirmed',
                Password::min(8)->letters()->mixedCase()->numbers()->symbols(),
            ],

            // Administrators are seeded, never self-registered — allowing it
            // here would be a privilege escalation route.
            'role' => ['required', Rule::in(['job_seeker', 'employer', 'author'])],

            'terms_accepted' => ['required', 'accepted'],
            'phone' => ['nullable', 'string', 'max:32'],

            /*
             * Employers name their company at sign-up. Without it an employer
             * account exists with nothing to post jobs under, and the company
             * record has to be invented later from the user's own name.
             *
             * required_if rather than required: the same endpoint serves job
             * seekers and authors, for whom these fields are meaningless.
             */
            'company_name' => ['required_if:role,employer', 'nullable', 'string', 'max:180'],
            'company_website' => ['nullable', 'url', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'role.in' => 'Choose one of: job seeker, employer, or article author.',
            'terms_accepted.accepted' => 'You must accept the Terms of Use and Privacy Policy.',
            'company_name.required_if' => 'Enter your company name.',
            'company_website.url' => 'Enter a full web address, including https://',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('email')) {
            $this->merge(['email' => mb_strtolower(trim((string) $this->input('email')))]);
        }
    }
}
