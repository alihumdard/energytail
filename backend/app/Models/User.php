<?php

namespace App\Models;

use App\Notifications\ResetPasswordNotification;
use App\Notifications\VerifyEmailNotification;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

/**
 * @property-read string $full_name Composed from first_name and last_name.
 * @property string|null $first_name
 * @property string|null $last_name
 * @property string $status
 * @property Carbon|null $last_login_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable, SoftDeletes;

    protected $fillable = [
        'first_name', 'last_name', 'name', 'email', 'password', 'phone',
        'avatar_path', 'status', 'locale', 'timezone',
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'suspended_at' => 'datetime',
            'last_login_at' => 'datetime',
        ];
    }

    /**
     * Suspended accounts keep their data but lose access. Checked at login
     * and by middleware rather than deleting the row, so an admin can
     * reverse the decision and the audit trail stays intact.
     */
    /**
     * Roles and permissions are stored against the 'web' guard.
     *
     * Requests authenticate through auth:sanctum, so without this the check
     * would run against the 'sanctum' guard and find no permissions at all —
     * Spatie keeps a separate set per guard.
     */
    public function guardName(): string
    {
        return 'web';
    }

    public function isSuspended(): bool
    {
        return $this->status === 'suspended';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function getFullNameAttribute(): string
    {
        $full = trim("{$this->first_name} {$this->last_name}");

        return $full !== '' ? $full : (string) $this->name;
    }

    // ---------------------------------------------------------------- auth

    /** @return HasMany<SocialAccount, $this> */
    public function socialAccounts(): HasMany
    {
        return $this->hasMany(SocialAccount::class);
    }

    // ------------------------------------------------------------- employer

    /**
     * Companies this user owns outright.
     *
     * @return HasMany<Company, $this>
     */
    public function ownedCompanies(): HasMany
    {
        return $this->hasMany(Company::class, 'owner_id');
    }

    /**
     * Companies this user can act for, including ones they do not own.
     *
     * @return BelongsToMany<Company, $this>
     */
    public function companies(): BelongsToMany
    {
        return $this->belongsToMany(Company::class, 'company_user')
            ->withPivot(['role', 'joined_at'])
            ->withTimestamps();
    }

    /**
     * Whether this user may act on a company's behalf.
     *
     * Ownership is not the only route: the company_user pivot lets an owner
     * bring colleagues in, and a recruiter working an account is as entitled
     * to post for it as the person who registered.
     */
    public function actsFor(Company $company): bool
    {
        if ($company->owner_id === $this->getKey()) {
            return true;
        }

        return $this->companies()->whereKey($company->getKey())->exists();
    }

    /**
     * The company this user posts under, or null.
     *
     * Owned companies come first: someone who registered their own employer
     * account should land on it rather than on a colleague's.
     */
    public function primaryCompany(): ?Company
    {
        return $this->ownedCompanies()->first() ?? $this->companies()->first();
    }

    /** @return HasMany<Job, $this> */
    public function postedJobs(): HasMany
    {
        return $this->hasMany(Job::class, 'posted_by');
    }

    // ----------------------------------------------------------- job seeker

    /** @return HasOne<SeekerProfile, $this> */
    public function seekerProfile(): HasOne
    {
        return $this->hasOne(SeekerProfile::class);
    }

    /** @return HasMany<Resume, $this> */
    public function resumes(): HasMany
    {
        return $this->hasMany(Resume::class);
    }

    /** @return HasMany<SeekerExperience, $this> */
    public function experiences(): HasMany
    {
        return $this->hasMany(SeekerExperience::class);
    }

    /** @return HasMany<SeekerEducation, $this> */
    public function educations(): HasMany
    {
        return $this->hasMany(SeekerEducation::class);
    }

    /** @return HasMany<SeekerCertificate, $this> */
    public function certificates(): HasMany
    {
        return $this->hasMany(SeekerCertificate::class);
    }

    /** @return HasMany<SeekerLanguage, $this> */
    public function languages(): HasMany
    {
        return $this->hasMany(SeekerLanguage::class);
    }

    /** @return BelongsToMany<Skill, $this> */
    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'seeker_skill')
            ->withPivot(['proficiency', 'years_experience', 'sort_order']);
    }

    /** @return HasMany<PortfolioItem, $this> */
    public function portfolioItems(): HasMany
    {
        return $this->hasMany(PortfolioItem::class);
    }

    /** @return BelongsToMany<Job, $this> */
    public function savedJobs(): BelongsToMany
    {
        return $this->belongsToMany(Job::class, 'saved_jobs')
            ->withPivot('note')
            ->withTimestamps();
    }

    /** @return HasMany<JobAlert, $this> */
    public function jobAlerts(): HasMany
    {
        return $this->hasMany(JobAlert::class);
    }

    // ------------------------------------------------------------ editorial

    /** @return HasMany<Article, $this> */
    public function articles(): HasMany
    {
        return $this->hasMany(Article::class, 'author_id');
    }

    /** @return HasMany<Comment, $this> */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    // --------------------------------------------------------- notifications

    /**
     * Overrides Laravel's plain built-in mail with the branded, queued one.
     */
    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new VerifyEmailNotification);
    }

    /** @param  string  $token */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }
}
