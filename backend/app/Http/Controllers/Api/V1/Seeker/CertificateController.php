<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Seeker;

use App\Models\SeekerCertificate;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

/**
 * Licences and certifications.
 *
 * Worth its own section in this industry: offshore and HSE roles routinely
 * require a specific ticket, and an expiry date is part of whether it counts.
 */
class CertificateController extends BaseSectionController
{
    protected function model(): string
    {
        return SeekerCertificate::class;
    }

    /** @return array<string, mixed> */
    protected function rules(Request $request, ?int $ignoreId = null): array
    {
        return [
            'name' => ['required', 'string', 'max:160'],
            'issuer' => ['nullable', 'string', 'max:160'],
            'credential_id' => ['nullable', 'string', 'max:120'],
            'credential_url' => ['nullable', 'url', 'max:255'],
            'issued_on' => ['nullable', 'date'],
            'expires_on' => ['nullable', 'date', 'after_or_equal:issued_on'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    /**
     * @param  Builder<Model>  $query
     * @return Builder<Model>
     */
    protected function applyOrder(Builder $query): Builder
    {
        return $query->orderByRaw('issued_on desc nulls last')->orderByDesc('id');
    }

    /** @return array<string, mixed> */
    protected function transform(Model $row): array
    {
        /** @var SeekerCertificate $row */
        return [
            'id' => $row->id,
            'name' => $row->name,
            'issuer' => $row->issuer,
            'credential_id' => $row->credential_id,
            'credential_url' => $row->credential_url,
            'issued_on' => $row->issued_on?->toDateString(),
            'expires_on' => $row->expires_on?->toDateString(),
            // Computed rather than stored: a stored flag would be wrong the
            // day after it was written.
            'is_expired' => $row->expires_on !== null && $row->expires_on->isPast(),
            'sort_order' => $row->sort_order,
        ];
    }
}
