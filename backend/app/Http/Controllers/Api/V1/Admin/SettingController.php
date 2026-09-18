<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\Admin\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SettingController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    /** All settings, grouped to match the tabs on the settings screen. */
    public function index(Request $request): JsonResponse
    {
        $this->authorizeSettings('view');

        $query = Setting::query()->orderBy('group')->orderBy('sort_order');

        if ($group = $request->string('group')->toString()) {
            $query->where('group', $group);
        }

        $grouped = [];

        foreach ($query->get() as $setting) {
            $grouped[$setting->group][] = [
                'key' => $setting->key,
                'value' => $setting->typedValue(),
                'type' => $setting->type,
                'is_public' => $setting->is_public,
                'description' => $setting->description,
            ];
        }

        return response()->json(['data' => $grouped]);
    }

    /**
     * Saves a batch of settings.
     *
     * The screen has one Save button per tab, so values arrive together and
     * are written in a transaction rather than one request per field.
     */
    public function update(Request $request): JsonResponse
    {
        $this->authorizeSettings('edit');

        $validated = $request->validate([
            'settings' => ['required', 'array', 'min:1'],
            'settings.*.key' => ['required', 'string', 'exists:settings,key'],
            'settings.*.value' => ['present'],
        ]);

        DB::transaction(function () use ($validated) {
            foreach ($validated['settings'] as $row) {
                $setting = Setting::where('key', $row['key'])->first();

                if (! $setting) {
                    continue;
                }

                $setting->update(['value' => $this->normalise($row['value'], $setting->type)]);
            }
        });

        $this->flushCache();

        $keys = collect($validated['settings'])->pluck('key')->implode(', ');
        $this->audit->log('settings', 'updated', "Updated settings: {$keys}");

        return response()->json(['message' => 'Settings saved.']);
    }

    /** Logo and favicon upload from the general tab. */
    public function uploadFile(Request $request): JsonResponse
    {
        $this->authorizeSettings('edit');

        $validated = $request->validate([
            'key' => ['required', 'string', 'exists:settings,key'],
            'file' => ['required', 'file', 'image', 'max:2048'],
        ]);

        $setting = Setting::where('key', $validated['key'])->firstOrFail();

        if ($setting->type !== 'file') {
            return response()->json([
                'message' => 'This setting does not accept a file.',
                'code' => 'invalid_setting_type',
            ], 422);
        }

        // Remove the previous file so replaced logos do not accumulate.
        if ($setting->value && Storage::disk('public')->exists($setting->value)) {
            Storage::disk('public')->delete($setting->value);
        }

        $path = $request->file('file')->store('settings', 'public');

        $setting->update(['value' => $path]);
        $this->flushCache();

        $this->audit->log('settings', 'updated', "Uploaded file for {$setting->key}", $setting);

        return response()->json([
            'message' => 'File uploaded.',
            'data' => ['key' => $setting->key, 'value' => $path, 'url' => Storage::url($path)],
        ]);
    }

    /**
     * Settings the public site needs — site name, logo, contact details.
     * Unauthenticated, so only rows flagged is_public are returned.
     */
    public function publicSettings(): JsonResponse
    {
        $data = Cache::remember('settings.public', now()->addHour(), function () {
            $values = [];

            foreach (Setting::public()->get() as $setting) {
                $values[$setting->key] = $setting->type === 'file' && $setting->value
                    ? Storage::url($setting->value)
                    : $setting->typedValue();
            }

            return $values;
        });

        return response()->json(['data' => $data]);
    }

    private function authorizeSettings(string $action): void
    {
        if (! request()->user()?->can("settings.{$action}")) {
            abort(403, 'You do not have permission to perform this action.');
        }
    }

    /** Values are stored as text, so each type is serialised consistently. */
    private function normalise(mixed $value, string $type): ?string
    {
        return match ($type) {
            'boolean' => $value ? '1' : '0',
            'json' => json_encode($value),
            default => $value === null ? null : (string) $value,
        };
    }

    private function flushCache(): void
    {
        Cache::forget('settings.public');

        // Through the model rather than by repeating its cache key: a rename
        // there would otherwise leave saved settings served from a stale
        // cache with nothing to show for it.
        Setting::flushCache();
    }
}
