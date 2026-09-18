<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One role in a candidate's work history.
 *
 * @property int $id
 * @property int $user_id
 * @property string $job_title
 * @property string $company_name
 * @property string|null $location
 * @property string|null $employment_type
 * @property Carbon|null $started_on
 * @property Carbon|null $ended_on
 * @property bool $is_current
 * @property string|null $description
 * @property int $sort_order
 */
class SeekerExperience extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'job_title', 'company_name', 'location', 'employment_type',
        'started_on', 'ended_on', 'is_current', 'description', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'started_on' => 'date',
            'ended_on' => 'date',
            'is_current' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
