<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * A licence or certification. Expiry matters in this industry: an offshore
 * ticket that has lapsed does not qualify the holder for the role.
 *
 * @property int $id
 * @property int $user_id
 * @property string $name
 * @property string|null $issuer
 * @property string|null $credential_id
 * @property string|null $credential_url
 * @property Carbon|null $issued_on
 * @property Carbon|null $expires_on
 * @property string|null $file_path
 * @property int $sort_order
 */
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
