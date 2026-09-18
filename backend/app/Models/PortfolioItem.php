<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * A project or work sample on a candidate's profile.
 *
 * @property int $id
 * @property int $user_id
 * @property string $title
 * @property string|null $description
 * @property string|null $url
 * @property string|null $image_path
 * @property Carbon|null $completed_on
 * @property int $sort_order
 */
class PortfolioItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'title', 'description', 'url',
        'image_path', 'completed_on', 'sort_order',
    ];

    protected function casts(): array
    {
        return ['completed_on' => 'date'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
