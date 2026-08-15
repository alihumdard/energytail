<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeekerCertificate extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'name', 'issuer', 'credential_id', 'credential_url',
        'issued_on', 'expires_on', 'file_path', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'issued_on' => 'date',
            'expires_on' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
