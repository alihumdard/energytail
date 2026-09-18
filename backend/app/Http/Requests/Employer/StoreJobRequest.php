<?php

declare(strict_types=1);

namespace App\Http\Requests\Employer;

use App\Models\Job;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreJobRequest extends FormRequest
{
    /** Authorisation is the controller's job, through JobPolicy. */
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
            /*
             * Administrators only. An employer's company is implied by who
             * they are; accepting it from them would be a way to post under
             * someone else's name.
             */
            'company_id' => [
                Rule::excludeIf(fn () => ! $this->user()?->hasRole('administrator')),
                'required', 'integer', 'exists:companies,id',
            ],

            'title' => ['required', 'string', 'max:180'],
            'description' => ['required', 'string', 'min:50'],
            'responsibilities' => ['nullable', 'string'],
            'requirements' => ['nullable', 'string'],
            'benefits' => ['nullable', 'string'],

            'job_category_id' => ['required', 'integer', 'exists:job_categories,id'],
            'industry_id' => ['nullable', 'integer', 'exists:industries,id'],
            'country_id' => ['required', 'integer', 'exists:countries,id'],
            'city_id' => ['nullable', 'integer', 'exists:cities,id'],
            'location_label' => ['nullable', 'string', 'max:180'],

            'employment_type' => ['required', Rule::in([
                'full_time', 'part_time', 'contract', 'temporary', 'internship',
            ])],
            'is_remote' => ['sometimes', 'boolean'],

            'experience_min' => ['nullable', 'integer', 'min:0', 'max:60'],
            'experience_max' => ['nullable', 'integer', 'min:0', 'max:60', 'gte:experience_min'],

            'salary_min' => ['nullable', 'numeric', 'min:0'],
            'salary_max' => ['nullable', 'numeric', 'min:0', 'gte:salary_min'],
            'salary_currency' => ['nullable', 'string', 'size:3'],
            'salary_period' => ['nullable', Rule::in(['hour', 'day', 'month', 'year'])],
            'salary_is_hidden' => ['sometimes', 'boolean'],

            /*
             * Applications leave the platform, so a listing is useless
             * without somewhere to send candidates. Which field is required
             * follows from the method chosen.
             */
            'apply_method' => ['required', Rule::in(['external_url', 'email'])],
            'apply_url' => ['required_if:apply_method,external_url', 'nullable', 'url', 'max:500'],
            'apply_email' => ['required_if:apply_method,email', 'nullable', 'email:rfc', 'max:255'],

            'deadline_at' => ['nullable', 'date', 'after:today'],

            'skills' => ['sometimes', 'array', 'max:15'],
            'skills.*' => ['integer', 'exists:skills,id'],

            // Draft or publish. Everything else — pending_review, expired,
            // closed — is decided by the system, never asked for.
            'status' => ['sometimes', Rule::in([Job::STATUS_DRAFT, Job::STATUS_PUBLISHED])],

            'meta_title' => ['nullable', 'string', 'max:160'],
            'meta_description' => ['nullable', 'string', 'max:320'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'description.min' => 'Give candidates a real description — at least 50 characters.',
            'apply_url.required_if' => 'Enter the web address where candidates should apply.',
            'apply_email.required_if' => 'Enter the address applications should go to.',
            'salary_max.gte' => 'The maximum salary cannot be below the minimum.',
            'experience_max.gte' => 'The maximum experience cannot be below the minimum.',
            'deadline_at.after' => 'The closing date must be in the future.',
        ];
    }
}
