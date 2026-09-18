<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A language the candidate speaks.
 *
 * @property int $id
 * @property int $user_id
 * @property string $language
 * @property string|null $proficiency
 * @property int $sort_order
 */
class SeekerLanguage extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'language', 'proficiency', 'sort_order'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
