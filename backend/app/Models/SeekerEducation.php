<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One qualification in a candidate's education history.
 *
 * @property int $id
 * @property int $user_id
 * @property string $institution
 * @property string|null $degree
 * @property string|null $field_of_study
 * @property string|null $grade
 * @property Carbon|null $started_on
 * @property Carbon|null $ended_on
 * @property bool $is_current
 * @property string|null $description
 * @property int $sort_order
 */
class SeekerEducation extends Model
{
    use HasFactory;

    /*
     * Set explicitly: Laravel's inflector treats "education" as uncountable
     * and derives "seeker_education", but the table is "seeker_educations".
     * Without this every query against this model fails at runtime.
     */
    protected $table = 'seeker_educations';

    protected $fillable = [
        'user_id', 'institution', 'degree', 'field_of_study', 'grade',
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
