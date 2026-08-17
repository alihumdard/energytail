<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

/**
 * Seeds the settings the admin Settings screen expects, grouped to match its
 * tabs. Idempotent, so adding a row here rolls out to existing environments
 * without disturbing values the client has already changed.
 */
class SettingSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->definitions() as $index => $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                [
                    'group' => $setting['group'],
                    'type' => $setting['type'] ?? 'string',
                    'is_public' => $setting['is_public'] ?? false,
                    'description' => $setting['description'] ?? null,
                    'sort_order' => $index,
                    // Only set a value on first insert. Re-running the seeder
                    // must never overwrite what the client configured.
                    'value' => Setting::where('key', $setting['key'])->value('value')
                        ?? ($setting['value'] ?? null),
                ]
            );
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function definitions(): array
    {
        return [
            // ---------------------------------------------------- general
            ['group' => 'general', 'key' => 'site_name', 'value' => 'Energy Tail', 'is_public' => true,
                'description' => 'Displayed in the browser title and header.'],
            ['group' => 'general', 'key' => 'site_tagline', 'value' => 'Oil, Gas & Energy Jobs Portal', 'is_public' => true],
            ['group' => 'general', 'key' => 'site_description', 'is_public' => true,
                'description' => 'Default meta description for search engines.'],
            ['group' => 'general', 'key' => 'site_logo', 'type' => 'file', 'is_public' => true],
            ['group' => 'general', 'key' => 'site_favicon', 'type' => 'file', 'is_public' => true],
            ['group' => 'general', 'key' => 'copyright_text', 'value' => '© 2026 Energy Tail. All rights reserved.', 'is_public' => true],
            ['group' => 'general', 'key' => 'footer_text', 'is_public' => true],

            // ------------------------------------------------------- site
            ['group' => 'site', 'key' => 'default_timezone', 'value' => 'UTC', 'is_public' => true],
            ['group' => 'site', 'key' => 'date_format', 'value' => 'M j, Y', 'is_public' => true],
            ['group' => 'site', 'key' => 'time_format', 'value' => 'g:i A', 'is_public' => true],
            ['group' => 'site', 'key' => 'maintenance_mode', 'value' => '0', 'type' => 'boolean', 'is_public' => true,
                'description' => 'Takes the public site offline while leaving the admin panel reachable.'],
            ['group' => 'site', 'key' => 'maintenance_message', 'is_public' => true],

            // Single language for launch. See decision D7 — multi-language is
            // in the settings design but absent from the plan document, so it
            // is not implemented until scoped and priced.
            ['group' => 'site', 'key' => 'default_language', 'value' => 'en', 'is_public' => true],

            // ------------------------------------------- users and access
            ['group' => 'users', 'key' => 'registration_enabled', 'value' => '1', 'type' => 'boolean', 'is_public' => true],
            ['group' => 'users', 'key' => 'email_verification_required', 'value' => '1', 'type' => 'boolean',
                'description' => 'Employers and authors must verify before publishing.'],
            ['group' => 'users', 'key' => 'default_role', 'value' => 'job_seeker'],

            // --------------------------------------------------- security
            ['group' => 'security', 'key' => 'recaptcha_enabled', 'value' => '0', 'type' => 'boolean', 'is_public' => true],
            ['group' => 'security', 'key' => 'recaptcha_site_key', 'is_public' => true],
            ['group' => 'security', 'key' => 'recaptcha_secret_key',
                'description' => 'Never exposed publicly.'],
            ['group' => 'security', 'key' => 'login_throttle_attempts', 'value' => '5', 'type' => 'integer'],

            // -------------------------------------------------------- seo
            ['group' => 'seo', 'key' => 'meta_title', 'is_public' => true],
            ['group' => 'seo', 'key' => 'meta_description', 'is_public' => true],
            ['group' => 'seo', 'key' => 'google_analytics_id', 'is_public' => true],
            ['group' => 'seo', 'key' => 'google_search_console_id', 'is_public' => true],
            ['group' => 'seo', 'key' => 'sitemap_enabled', 'value' => '1', 'type' => 'boolean'],

            // ------------------------------------------------------- jobs
            ['group' => 'jobs', 'key' => 'jobs_require_approval', 'value' => '0', 'type' => 'boolean',
                'description' => 'When enabled, new listings wait for admin approval before going live.'],
            ['group' => 'jobs', 'key' => 'job_default_duration_days', 'value' => '30', 'type' => 'integer'],
            ['group' => 'jobs', 'key' => 'jobs_per_page', 'value' => '15', 'type' => 'integer', 'is_public' => true],

            // --------------------------------------------------- articles
            ['group' => 'articles', 'key' => 'articles_require_approval', 'value' => '1', 'type' => 'boolean'],
            ['group' => 'articles', 'key' => 'comments_enabled', 'value' => '1', 'type' => 'boolean', 'is_public' => true],
            ['group' => 'articles', 'key' => 'comments_require_approval', 'value' => '1', 'type' => 'boolean'],
            ['group' => 'articles', 'key' => 'guest_comments_enabled', 'value' => '0', 'type' => 'boolean', 'is_public' => true],

            // ---------------------------------------------------- storage
            ['group' => 'storage', 'key' => 'max_resume_size_mb', 'value' => '5', 'type' => 'integer', 'is_public' => true],
            ['group' => 'storage', 'key' => 'max_image_size_mb', 'value' => '2', 'type' => 'integer', 'is_public' => true],
            ['group' => 'storage', 'key' => 'allowed_resume_types', 'value' => '["pdf","doc","docx"]', 'type' => 'json', 'is_public' => true],

            // ------------------------------------------------------ email
            ['group' => 'email', 'key' => 'from_name', 'value' => 'Energy Tail'],
            ['group' => 'email', 'key' => 'from_address', 'value' => 'noreply@energytail.com'],
            ['group' => 'email', 'key' => 'admin_notification_email'],

            // ----------------------------------------------------- social
            ['group' => 'social', 'key' => 'facebook_url', 'is_public' => true],
            ['group' => 'social', 'key' => 'twitter_url', 'is_public' => true],
            ['group' => 'social', 'key' => 'linkedin_url', 'is_public' => true],
            ['group' => 'social', 'key' => 'instagram_url', 'is_public' => true],
            ['group' => 'social', 'key' => 'youtube_url', 'is_public' => true],

            // ---------------------------------------------------- contact
            ['group' => 'contact', 'key' => 'contact_email', 'value' => 'info@energytail.com', 'is_public' => true],
            ['group' => 'contact', 'key' => 'contact_phone', 'is_public' => true],
            ['group' => 'contact', 'key' => 'contact_address', 'is_public' => true],
        ];
    }
}
