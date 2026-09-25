<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Employer;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * An employer's own company profile.
 *
 * The company an employer acts for, not any company — CompanyPolicy checks
 * ownership through actsFor(), so holding companies.edit never means editing
 * a competitor's page.
 */
class EmployerCompanyController extends Controller
{
    /** The caller's company, or null if they have not set one up. */
    public function show(Request $request): JsonResponse
    {
        $company = $request->user()?->primaryCompany();

        if ($company === null) {
            // Not an error: a new employer legitimately has no company yet,
            // and the form that calls this needs to know to offer creation.
            return response()->json(['data' => null]);
        }

        $this->authorize('view', $company);

        $company->load([
            'industry:id,name,slug',
            'country:id,name,code,flag_emoji',
            'city:id,name',
            'socials:id,company_id,platform,url',
        ])->loadCount(['jobs', 'publishedJobs']);

        return response()->json(['data' => $this->transform($company)]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Company::class);

        $user = $request->user();

        if ($user?->primaryCompany() !== null) {
            throw ValidationException::withMessages([
                'name' => ['You already have a company profile.'],
            ]);
        }

        $validated = $this->withLogo($request, $this->validated($request, creating: true));

        $company = Company::query()->create($validated + [
            'owner_id' => $user?->getKey(),
            'slug' => $this->slug($validated['name']),
            /*
             * Pending, not active.
             *
             * A company profile carries a name and a description that appear
             * on the public directory, so a moderator approves it before it
             * is listed. The employer can still post jobs meanwhile.
             */
            'status' => Company::STATUS_PENDING,
            // Verification and homepage placement are a moderator's decision.
            'is_verified' => false,
            'is_featured' => false,
        ]);

        $company->load(['industry', 'country', 'city'])->loadCount(['jobs', 'publishedJobs']);

        return response()->json([
            'message' => 'Company profile created and sent for review.',
            'data' => $this->transform($company),
        ], 201);
    }

    public function update(Request $request, Company $company): JsonResponse
    {
        $this->authorize('update', $company);

        $company->update(
            $this->withLogo($request, $this->validated($request, creating: false), $company),
        );

        $company->load([
            'industry:id,name,slug',
            'country:id,name,code,flag_emoji',
            'city:id,name',
        ])->loadCount(['jobs', 'publishedJobs']);

        return response()->json([
            'message' => 'Company profile updated.',
            'data' => $this->transform($company),
        ]);
    }

    /**
     * Fields an employer may set.
     *
     * status, is_verified and is_featured are absent on purpose: an employer
     * setting their own company active, verified or featured would make the
     * whole moderation queue decorative.
     *
     * @return array<string, mixed>
     */
    private function validated(Request $request, bool $creating): array
    {
        $required = $creating ? 'required' : 'sometimes';

        return $request->validate([
            'name' => [$required, 'string', 'max:180'],
            /*
             * 4MB, matching the job featured image. The file itself is not a
             * column — withLogo() turns it into logo_path — but it has to be
             * validated here or an employer could upload anything.
             */
            'logo' => ['sometimes', 'image', 'mimes:jpeg,jpg,png,webp', 'max:4096'],
            'remove_logo' => ['sometimes', 'boolean'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'website' => ['sometimes', 'nullable', 'url', 'max:255'],
            'email' => ['sometimes', 'nullable', 'email:rfc', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'industry_id' => ['sometimes', 'nullable', 'integer', 'exists:industries,id'],
            'country_id' => ['sometimes', 'nullable', 'integer', 'exists:countries,id'],
            'city_id' => ['sometimes', 'nullable', 'integer', 'exists:cities,id'],
            'company_size' => ['sometimes', 'nullable', 'string', 'max:40'],
            'founded_year' => ['sometimes', 'nullable', 'integer', 'min:1800', 'max:'.date('Y')],
            'meta_title' => ['sometimes', 'nullable', 'string', 'max:160'],
            'meta_description' => ['sometimes', 'nullable', 'string', 'max:320'],
        ], [
            'name.required' => 'Your company needs a name before you can post jobs.',
        ]);
    }

    /**
     * Turns an uploaded logo into the column the model actually stores.
     *
     * `logo` and `remove_logo` are instructions, not fields: they say what to
     * do with a file, and passing them to update() would try to write columns
     * that do not exist. The previous file is deleted only once the new one
     * is stored, so a failed upload cannot leave the company with no logo.
     */
    private function withLogo(Request $request, array $data, ?Company $company = null): array
    {
        unset($data['logo'], $data['remove_logo']);

        $previous = $company?->logo_path;

        if ($request->hasFile('logo')) {
            $data['logo_path'] = $request->file('logo')->store('companies', 'public');

            if ($previous !== null) {
                Storage::disk('public')->delete($previous);
            }

            return $data;
        }

        if ($request->boolean('remove_logo')) {
            $data['logo_path'] = null;

            if ($previous !== null) {
                Storage::disk('public')->delete($previous);
            }
        }

        return $data;
    }

    /** A slug that stays unique without a lookup loop. */
    private function slug(string $name): string
    {
        return Str::slug($name).'-'.Str::lower(Str::random(4));
    }

    /** @return array<string, mixed> */
    private function transform(Company $company): array
    {
        return [
            'id' => $company->id,
            'name' => $company->name,
            'slug' => $company->slug,
            'description' => $company->description,
            'website' => $company->website,
            'email' => $company->email,
            'phone' => $company->phone,
            'address' => $company->address,
            'company_size' => $company->company_size,
            'founded_year' => $company->founded_year,
            'logo_path' => $company->logo_path,
            'status' => $company->status,
            'is_verified' => $company->is_verified,
            'is_featured' => $company->is_featured,
            // Counted live: companies.jobs_count is a denormalised column
            // that has already drifted.
            'jobs_count' => $company->jobs_count ?? 0,
            'published_jobs_count' => $company->published_jobs_count ?? 0,
            'industry_id' => $company->industry_id,
            'country_id' => $company->country_id,
            'city_id' => $company->city_id,
            'meta_title' => $company->meta_title,
            'meta_description' => $company->meta_description,
            'industry' => $company->relationLoaded('industry') && $company->industry
                ? ['id' => $company->industry->id, 'name' => $company->industry->name]
                : null,
            'country' => $company->relationLoaded('country') && $company->country
                ? ['id' => $company->country->id, 'name' => $company->country->name]
                : null,
            'city' => $company->relationLoaded('city') && $company->city
                ? ['id' => $company->city->id, 'name' => $company->city->name]
                : null,
            /*
             * Whether this profile is on the public directory. The employer
             * needs to know a pending profile is not yet listed, rather than
             * wondering why searching for it finds nothing.
             */
            'is_listed' => $company->status === Company::STATUS_ACTIVE,
        ];
    }
}
