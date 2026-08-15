<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Resume extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'title', 'disk', 'path', 'original_name',
        'mime_type', 'size_bytes', 'is_default',
    ];

    /**
     * The storage path never leaves the server. Resumes live on a private
     * disk and are served through short-lived signed URLs, so exposing the
     * raw path would undermine that.
     */
    protected $hidden = ['path', 'disk'];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
            'size_bytes' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
