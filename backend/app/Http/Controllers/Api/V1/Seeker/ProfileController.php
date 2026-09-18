<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Seeker;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Resume;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

/**
 * A candidate's own profile and CVs.
 *
 * Scoped to the caller throughout — there is no path here that takes another
 * user's id, so there is nothing to authorise beyond being signed in.
 */
class ProfileController extends Controller
{
    /** How many CVs one account may keep. */
    private const MAX_RESUMES = 5;

    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'data' => new UserResource($request->user()),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'first_name' => ['sometimes', 'string', 'max:80'],
            'last_name' => ['sometimes', 'string', 'max:80'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'locale' => ['sometimes', 'string', 'max:10'],
            'timezone' => ['sometimes', 'nullable', 'string', 'max:64'],
        ]);

        /*
         * Email is deliberately absent.
         *
         * Changing it would move the account to an address nobody has proved
         * they control, and the verification flow is what makes an address
         * trustworthy. It belongs behind its own confirm-and-reverify step.
         */
        $user->update($validated);

        return response()->json([
            'message' => 'Profile updated.',
            'data' => new UserResource($user->fresh()),
        ]);
    }

    public function resumes(Request $request): JsonResponse
    {
        $resumes = Resume::query()
            ->where('user_id', $request->user()?->getKey())
            ->latest('id')
            ->get();

        return response()->json([
            'data' => $resumes->map(fn (Resume $resume) => $this->transform($resume))->all(),
        ]);
    }

    public function uploadResume(Request $request): JsonResponse
    {
        $userId = $request->user()?->getKey();

        if (Resume::query()->where('user_id', $userId)->count() >= self::MAX_RESUMES) {
            throw ValidationException::withMessages([
                'file' => ['You can keep up to '.self::MAX_RESUMES.' CVs. Delete one to upload another.'],
            ]);
        }

        $validated = $request->validate([
            /*
             * PDF and Word only, capped at 5 MB.
             *
             * The extension list is enforced by Laravel against the file's
             * real MIME type, not its name — an .exe renamed to .pdf fails.
             */
            'file' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
            'title' => ['sometimes', 'nullable', 'string', 'max:120'],
        ], [
            'file.mimes' => 'Upload a PDF or Word document.',
            'file.max' => 'Keep the file under 5 MB.',
        ]);

        $file = $request->file('file');

        /*
         * Stored on the private local disk, never public.
         *
         * A CV carries a home address and phone number; a guessable public
         * URL would expose every candidate's. Downloads go through a
         * signed, authenticated route instead.
         */
        $path = $file->store("resumes/{$userId}", 'local');

        $resume = DB::transaction(function () use ($userId, $file, $path, $validated) {
            $isFirst = ! Resume::query()->where('user_id', $userId)->exists();

            return Resume::query()->create([
                'user_id' => $userId,
                'title' => $validated['title'] ?? pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
                'disk' => 'local',
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType(),
                'size_bytes' => $file->getSize(),
                // The first CV uploaded becomes the default, so a candidate
                // who uploads one and stops has a usable profile.
                'is_default' => $isFirst,
            ]);
        });

        return response()->json([
            'message' => 'CV uploaded.',
            'data' => $this->transform($resume),
        ], 201);
    }

    /** Marks one CV as the one to send. */
    public function setDefaultResume(Request $request, Resume $resume): JsonResponse
    {
        $this->ensureOwned($request, $resume);

        DB::transaction(function () use ($request, $resume) {
            Resume::query()
                ->where('user_id', $request->user()?->getKey())
                ->update(['is_default' => false]);

            $resume->update(['is_default' => true]);
        });

        return response()->json([
            'message' => 'Default CV updated.',
            'data' => $this->transform($resume->fresh()),
        ]);
    }

    public function deleteResume(Request $request, Resume $resume): JsonResponse
    {
        $this->ensureOwned($request, $resume);

        $wasDefault = $resume->is_default;
        $userId = $request->user()?->getKey();

        DB::transaction(function () use ($resume, $wasDefault, $userId) {
            Storage::disk($resume->disk)->delete($resume->path);
            $resume->delete();

            // Promote another CV rather than leaving the candidate with
            // several and none marked as the one to send.
            if ($wasDefault) {
                $next = Resume::query()->where('user_id', $userId)->latest('id')->first();
                $next?->update(['is_default' => true]);
            }
        });

        return response()->json(['message' => 'CV deleted.']);
    }

    /** Streams a CV back to its owner. */
    public function downloadResume(Request $request, Resume $resume)
    {
        $this->ensureOwned($request, $resume);

        abort_unless(Storage::disk($resume->disk)->exists($resume->path), 404);

        return Storage::disk($resume->disk)->download($resume->path, $resume->original_name);
    }

    /**
     * Refuses a CV belonging to someone else.
     *
     * 404 rather than 403: confirming a resume exists would leak that another
     * user has one with that id.
     */
    private function ensureOwned(Request $request, Resume $resume): void
    {
        abort_if($resume->user_id !== $request->user()?->getKey(), 404);
    }

    /** @return array<string, mixed> */
    private function transform(Resume $resume): array
    {
        return [
            'id' => $resume->id,
            'title' => $resume->title,
            'original_name' => $resume->original_name,
            'mime_type' => $resume->mime_type,
            'size_bytes' => $resume->size_bytes,
            'is_default' => $resume->is_default,
            'created_at' => $resume->created_at?->toIso8601String(),
            // The storage path never leaves the server: it would let a caller
            // reason about the disk layout. Downloads go through the route.
        ];
    }
}
