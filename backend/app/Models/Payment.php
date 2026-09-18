<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $company_id
 * @property int|null $subscription_id
 * @property string|null $stripe_payment_intent_id
 * @property string|null $stripe_invoice_id
 * @property int $amount_cents
 * @property string $currency
 * @property string $status
 * @property string|null $failure_reason
 * @property string|null $invoice_url
 * @property string|null $invoice_pdf_url
 * @property Carbon|null $paid_at
 * @property Carbon|null $created_at
 */
class Payment extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';

    public const STATUS_SUCCEEDED = 'succeeded';

    public const STATUS_FAILED = 'failed';

    public const STATUS_REFUNDED = 'refunded';

    protected $fillable = [
        'company_id', 'subscription_id', 'stripe_payment_intent_id',
        'stripe_invoice_id', 'amount_cents', 'currency', 'status',
        'failure_reason', 'invoice_url', 'invoice_pdf_url', 'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount_cents' => 'integer',
            'paid_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Company, $this> */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /** @return BelongsTo<Subscription, $this> */
    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    /** For display only — never for arithmetic. */
    public function amountInMajorUnits(): float
    {
        return $this->amount_cents / 100;
    }
}
