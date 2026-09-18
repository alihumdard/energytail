<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Reports whether outgoing mail is actually working, and lets an
 * administrator prove it with a test send.
 *
 * Queued mail answers 200 the moment the job is accepted, so a broken relay
 * is invisible from the UI — a user is told their verification email is on
 * its way while the job quietly lands in failed_jobs. This surfaces that.
 */
class MailHealthController extends Controller
{
    public function show(): JsonResponse
    {
        $this->authorizeSettings('view');

        $mailer = (string) Config::get('mail.default');

        return response()->json([
            'data' => [
                'mailer' => $mailer,
                'host' => Config::get("mail.mailers.{$mailer}.host"),
                'from' => Config::get('mail.from.address'),

                // 'log' writes to storage/logs instead of sending. Fine for
                // development, and worth flagging loudly anywhere else.
                'delivers' => $mailer !== 'log',

                'queue' => [
                    'pending' => DB::table('queue_jobs')->count(),
                    'failed' => DB::table('failed_jobs')->count(),
                    'last_failure' => $this->lastFailure(),
                ],
            ],
        ]);
    }

    /** Sends a test message to the address the administrator asks for. */
    public function send(Request $request): JsonResponse
    {
        $this->authorizeSettings('edit');

        $validated = $request->validate([
            'email' => ['required', 'email:rfc', 'max:255'],
        ]);

        try {
            /*
             * Sent synchronously, unlike every other mail in the app: the
             * point is to find out whether the relay accepts it, and a queued
             * send would report success before anyone had spoken to it.
             */
            Mail::raw(
                'This is a test message from '.Config::get('app.name').
                '. If it reached you, outgoing mail is working.',
                fn ($message) => $message
                    ->to($validated['email'])
                    ->subject(Config::get('app.name').' — mail test')
            );
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'The mail server refused the message.',
                'code' => 'mail_send_failed',
                'errors' => ['email' => [$e->getMessage()]],
            ], 422);
        }

        return response()->json([
            'message' => "Test message sent to {$validated['email']}.",
        ]);
    }

    /** Mirrors SettingController: mail configuration is part of settings. */
    private function authorizeSettings(string $action): void
    {
        if (! request()->user()?->can("settings.{$action}")) {
            abort(403, 'You do not have permission to perform this action.');
        }
    }

    /** @return array<string, string>|null */
    private function lastFailure(): ?array
    {
        $row = DB::table('failed_jobs')->latest('failed_at')->first();

        if ($row === null) {
            return null;
        }

        return [
            'failed_at' => (string) $row->failed_at,
            // First line only: the full stack trace is pages long and the
            // message is the part that names the cause.
            'reason' => strtok((string) $row->exception, "\n") ?: 'Unknown error.',
        ];
    }
}
