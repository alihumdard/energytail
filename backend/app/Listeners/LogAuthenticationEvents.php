<?php

namespace App\Listeners;

use App\Models\User;
use App\Services\Admin\AuditLogger;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Logout;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;

/**
 * Records authentication events in the audit log.
 *
 * The design's audit screen shows a Login row under an "Auth" module, so
 * these have to be captured alongside model changes rather than only in the
 * application log.
 */
class LogAuthenticationEvents
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function handleLogin(object $event): void
    {
        $user = $event->user;

        if ($user instanceof User) {
            $this->audit->logAuth('login', 'Signed in', $user);
        }
    }

    public function handleLogout(Logout $event): void
    {
        $user = $event->user;

        if ($user instanceof User) {
            $this->audit->logAuth('logout', 'Signed out', $user);
        }
    }

    /**
     * Failed attempts matter more than successful ones for spotting an attack,
     * so they are recorded with the attempted address and a failed status.
     */
    public function handleFailed(Failed $event): void
    {
        $this->audit->log(
            module: 'auth',
            action: 'login_failed',
            description: 'Failed sign-in attempt for '.($event->credentials['email'] ?? 'unknown'),
            status: 'failed',
        );
    }

    public function handleRegistered(Registered $event): void
    {
        $user = $event->user;

        if ($user instanceof User) {
            $this->audit->logAuth('register', 'Account created', $user, 'pending');
        }
    }

    public function handleVerified(Verified $event): void
    {
        $user = $event->user;

        if ($user instanceof User) {
            $this->audit->logAuth('verify_email', 'Email address verified', $user);
        }
    }

    public function handlePasswordReset(PasswordReset $event): void
    {
        $user = $event->user;

        if ($user instanceof User) {
            $this->audit->logAuth('password_reset', 'Password reset', $user);
        }
    }
}
