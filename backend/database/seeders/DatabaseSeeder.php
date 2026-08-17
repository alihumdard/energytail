<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seeds reference data that every environment needs, then demo content
     * only outside production.
     *
     * Roles, settings and taxonomy are production data the client edits — not
     * throwaway fixtures — so they run everywhere and are safe to re-run.
     */
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            SettingSeeder::class,
            TaxonomySeeder::class,
        ]);

        // Demo content is destructive to a live site's credibility (fake
        // companies, fake jobs), so it never runs in production.
        if (! app()->environment('production')) {
            $this->call(DemoDataSeeder::class);
        }
    }
}
