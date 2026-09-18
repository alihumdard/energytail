<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Seeker;

use App\Models\SeekerLanguage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Languages the candidate speaks. */
class LanguageController extends BaseSectionController
{
    /** The CEFR-style ladder the form offers. */
    public const PROFICIENCY = ['basic', 'conversational', 'professional', 'fluent', 'native'];

    protected function model(): string
    {
        return SeekerLanguage::class;
    }

    /**
     * Rules, including the duplicate check the table enforces.
     *
     * (user_id, language) is unique — a candidate listing English twice is a
     * mistake, not two facts. Without this the insert reaches the database and
     * comes back as a 500, which tells the candidate nothing about what they
     * did wrong.
     *
     * @return array<string, mixed>
     */
    protected function rules(Request $request, ?int $ignoreId = null): array
    {
        return [
            'language' => [
                'required', 'string', 'max:80',
                Rule::unique('seeker_languages', 'language')
                    ->where('user_id', $request->user()?->getKey())
                    ->ignore($ignoreId),
            ],
            'proficiency' => ['nullable', Rule::in(self::PROFICIENCY)],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    /** @return array<string, mixed> */
    protected function transform(Model $row): array
    {
        /** @var SeekerLanguage $row */
        return [
            'id' => $row->id,
            'language' => $row->language,
            'proficiency' => $row->proficiency,
            'sort_order' => $row->sort_order,
        ];
    }
}
