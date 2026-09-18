<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Services\Admin\AuditLogger;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Every company on the platform, for moderation.
 *
 * Unscoped by design: an administrator approves, verifies and suspends
 * companies, none of which is possible from inside a single company's own
 * workspace.
 */
class AdminCompanyController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function index(Request $request): JsonResponse
    {
        /*
         * 'approve', not 'viewAny'.
         *
         * An employer holds companies.view for their own workspace, so
         * viewAny would let them page through every company on the platform,
         * owner email included. The moderation permission is what separates a
         * moderator from someone who merely has a company of their own.
         */
        $this->authorize('approve', Company::class);

        $query = Company::query()
            ->with([
                'owner:id,first_name,last_name,email',
                'industry:id,name,slug',
                'country:id,name,code,flag_emoji',
                'city:id,name',
            ])
            /*
             * Counted live rather than read from the companies.jobs_count
             * column, which is a denormalised counter that has already drifted
             * — one seeded company stores 6 against 12 actual jobs.
             */
            ->withCount('jobs');

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($request->filled('verified')) {
            $query->where('is_verified', $request->boolean('verified'));
        }

        if ($request->filled('featured')) {
            $query->where('is_featured', $request->boolean('featured'));
        }

        if ($term = trim($request->string('search')->toString())) {
            $like = '%'.str_replace('%', '\%', $term).'%';

            $query->where(fn (Builder $q) => $q
                ->where('name', 'ilike', $like)
                ->orWhere('email', 'ilike', $like)
                ->orWhere('website', 'ilike', $like));
        }

        // Pending first: a moderation queue should open on the work waiting to
        // be done. The id tiebreaker keeps the order stable — Postgres gives
        // no order among equal rows, and an UPDATE moves the row to the heap
        // end, which is what made an edited row appear to swap with another.
        $query->orderByRaw('case when status = ? then 0 else 1 end', [Company::STATUS_PENDING])
            ->latest('created_at')
            ->orderByDesc('id');

        $perPage = min(100, max(1, $request->integer('per_page', 15)));
        $companies = $query->paginate($perPage);

        return response()->json([
            'data' => collect($companies->items())
                ->map(fn (Company $company) => $this->transform($company))
                ->all(),
            'meta' => [
                'current_page' => $companies->currentPage(),
                'last_page' => $companies->lastPage(),
                'per_page' => $companies->perPage(),
                'total' => $companies->total(),
            ],
        ]);
    }

    public function stats(): JsonResponse
    {
        $this->authorize('approve', Company::class);

        $byStatus = Company::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $total = (int) $byStatus->sum();

        return response()->json([
            'data' => [
                'stats' => [
                    'total' => $total,
                    'active' => (int) ($byStatus[Company::STATUS_ACTIVE] ?? 0),
                    'pending' => (int) ($byStatus[Company::STATUS_PENDING] ?? 0),
                    'suspended' => (int) ($byStatus[Company::STATUS_SUSPENDED] ?? 0),
                    'inactive' => (int) ($byStatus[Company::STATUS_INACTIVE] ?? 0),
                    'verified' => Company::query()->where('is_verified', true)->count(),
                    'featured' => Company::query()->where('is_featured', true)->count(),
                ],
                'donut' => $this->donut($byStatus, $total),
            ],
        ]);
    }

    public function show(Company $company): JsonResponse
    {
        // Any company, not just the caller's — hence the moderation gate.
        $this->authorize('approve', Company::class);

        $company->load([
            'owner:id,first_name,last_name,email',
            'industry:id,name,slug',
            'country:id,name,code,flag_emoji',
            'city:id,name',
        ])->loadCount('jobs');

        return response()->json(['data' => $this->transform($company, detailed: true)]);
    }

    public function update(Request $request, Company $company): JsonResponse
    {
        $this->authorize('update', $company);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:180'],
            'email' => ['sometimes', 'nullable', 'email:rfc', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'website' => ['sometimes', 'nullable', 'url', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'industry_id' => ['sometimes', 'nullable', 'integer', 'exists:industries,id'],
            'country_id' => ['sometimes', 'nullable', 'integer', 'exists:countries,id'],
            'city_id' => ['sometimes', 'nullable', 'integer', 'exists:cities,id'],
            'founded_year' => ['sometimes', 'nullable', 'integer', 'min:1800', 'max:'.date('Y')],
            'status' => ['sometimes', Rule::in([
                Company::STATUS_PENDING,
                Company::STATUS_ACTIVE,
                Company::STATUS_SUSPENDED,
                Company::STATUS_INACTIVE,
            ])],
        ]);

        $company->update($validated);

        $this->audit->log('companies', 'updated', "Updated company: {$company->name}", $company);

        return response()->json([
            'message' => 'Company updated.',
            'data' => $this->transform($company->fresh()->loadCount('jobs')),
        ]);
    }

    /** Approves a company that was waiting for review. */
    public function approve(Company $company): JsonResponse
    {
        $this->authorize('approve', Company::class);

        if ($company->status === Company::STATUS_ACTIVE) {
            throw ValidationException::withMessages([
                'status' => ['This company is already active.'],
            ]);
        }

        $company->update(['status' => Company::STATUS_ACTIVE]);

        $this->audit->log('companies', 'approved', "Approved company: {$company->name}", $company);

        return response()->json([
            'message' => 'Company approved.',
            'data' => $this->transform($company->fresh()->loadCount('jobs')),
        ]);
    }

    /**
     * Suspends a company.
     *
     * Suspended rather than deleted, and the reason is recorded: the company
     * has listings and history attached, and an administrator answering "why
     * did our page disappear" needs something to point at.
     */
    public function suspend(Request $request, Company $company): JsonResponse
    {
        $this->authorize('approve', Company::class);

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $company->update(['status' => Company::STATUS_SUSPENDED]);

        $this->audit->log(
            'companies',
            'suspended',
            "Suspended company {$company->name}: {$validated['reason']}",
            $company,
        );

        return response()->json([
            'message' => 'Company suspended.',
            'data' => $this->transform($company->fresh()->loadCount('jobs')),
        ]);
    }

    /**
     * Toggles the verified badge.
     *
     * Separate from status on purpose: an active company is one allowed to
     * operate, a verified one is a company whose identity has been checked.
     */
    public function toggleVerified(Company $company): JsonResponse
    {
        $this->authorize('approve', Company::class);

        $verified = ! $company->is_verified;

        $company->update([
            'is_verified' => $verified,
            'verified_at' => $verified ? now() : null,
        ]);

        $this->audit->log(
            'companies',
            'updated',
            ($verified ? 'Verified' : 'Unverified')." company: {$company->name}",
            $company,
        );

        return response()->json([
            'message' => $verified ? 'Company verified.' : 'Verification removed.',
            'data' => $this->transform($company->fresh()->loadCount('jobs')),
        ]);
    }

    /** Toggles the paid homepage placement. */
    public function toggleFeatured(Company $company): JsonResponse
    {
        $this->authorize('update', $company);

        $featured = ! $company->is_featured;
        $company->update(['is_featured' => $featured]);

        $this->audit->log(
            'companies',
            'updated',
            ($featured ? 'Featured' : 'Unfeatured')." company: {$company->name}",
            $company,
        );

        return response()->json([
            'message' => $featured ? 'Company featured.' : 'Company no longer featured.',
            'data' => $this->transform($company->fresh()->loadCount('jobs')),
        ]);
    }

    /**
     * @param  Collection<string, int>  $byStatus
     * @return array<int, array<string, mixed>>
     */
    private function donut(Collection $byStatus, int $total): array
    {
        $colours = [
            Company::STATUS_ACTIVE => ['Active', '#10b981'],
            Company::STATUS_PENDING => ['Pending', '#3b82f6'],
            Company::STATUS_SUSPENDED => ['Suspended', '#ef4444'],
            Company::STATUS_INACTIVE => ['Inactive', '#94a3b8'],
        ];

        $divisor = max(1, $total);

        return collect($colours)->map(function (array $meta, string $status) use ($byStatus, $divisor) {
            $count = (int) ($byStatus[$status] ?? 0);

            return [
                'label' => $meta[0],
                'value' => $count,
                'pct' => round($count / $divisor * 100, 1),
                'color' => $meta[1],
            ];
        })->values()->all();
    }

    /** @return array<string, mixed> */
    private function transform(Company $company, bool $detailed = false): array
    {
        $base = [
            'id' => $company->id,
            'name' => $company->name,
            'slug' => $company->slug,
            'email' => $company->email,
            'phone' => $company->phone,
            'website' => $company->website,
            'status' => $company->status,
            'is_verified' => $company->is_verified,
            'is_featured' => $company->is_featured,
            'logo_path' => $company->logo_path,
            'company_size' => $company->company_size,
            'founded_year' => $company->founded_year,
            // The live count, not the drifted jobs_count column.
            'jobs_count' => $company->jobs_count ?? 0,
            'created_at' => $company->created_at?->toIso8601String(),
            'verified_at' => $company->verified_at?->toIso8601String(),
            // owner_id is NOT NULL, so a loaded relation always has an owner.
            'owner' => $company->relationLoaded('owner') ? [
                'id' => $company->owner->id,
                'name' => $company->owner->full_name,
                'email' => $company->owner->email,
            ] : null,
            'industry' => $company->relationLoaded('industry') && $company->industry
                ? ['id' => $company->industry->id, 'name' => $company->industry->name]
                : null,
            'country' => $company->relationLoaded('country') && $company->country
                ? ['id' => $company->country->id, 'name' => $company->country->name, 'code' => $company->country->code]
                : null,
            'city' => $company->relationLoaded('city') && $company->city
                ? ['id' => $company->city->id, 'name' => $company->city->name]
                : null,
        ];

        if (! $detailed) {
            return $base;
        }

        return $base + [
            'description' => $company->description,
            'address' => $company->address,
            'industry_id' => $company->industry_id,
            'country_id' => $company->country_id,
            'city_id' => $company->city_id,
            'meta_title' => $company->meta_title,
            'meta_description' => $company->meta_description,
        ];
    }
}
