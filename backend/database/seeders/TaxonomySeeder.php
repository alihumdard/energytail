<?php

namespace Database\Seeders;

use App\Models\ArticleCategory;
use App\Models\City;
use App\Models\Country;
use App\Models\Industry;
use App\Models\JobCategory;
use App\Models\Skill;
use App\Models\Tag;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Reference data for the energy sector. These are real operating values, not
 * placeholders — the taxonomy is production content the client edits rather
 * than demo data to be thrown away.
 */
class TaxonomySeeder extends Seeder
{
    public function run(): void
    {
        $this->seedIndustries();
        $this->seedJobCategories();
        $this->seedArticleCategories();
        $this->seedCountriesAndCities();
        $this->seedSkills();
        $this->seedTags();
    }

    private function seedIndustries(): void
    {
        $rows = [
            ['Oil & Gas', 'Exploration, drilling, production and distribution', '⛏️', '#3b82f6'],
            ['Renewable Energy', 'Solar, wind, hydro, biomass and more', '🌿', '#f97316'],
            ['Energy Services', 'Support services for energy operations', '🏗️', '#10b981'],
            ['Power Generation', 'Conventional and non-conventional power', '⚡', '#eab308'],
            ['Petrochemicals', 'Petrochemical and downstream products', '🧪', '#f97316'],
            ['LNG', 'Liquefied Natural Gas industry', '🚢', '#0ea5e9'],
            ['Mining', 'Mining and mineral extraction', '⛰️', '#ef4444'],
            ['Environment & Sustainability', 'Environmental management and sustainability', '🌎', '#22c55e'],
            ['Engineering & Construction', 'Engineering, procurement and construction', '🏢', '#f59e0b'],
            ['Consulting', 'Management and technical consulting', '📈', '#3b82f6'],
        ];

        foreach ($rows as $i => [$name, $description, $emoji, $color]) {
            Industry::updateOrCreate(
                ['slug' => Str::slug($name)],
                compact('name', 'description', 'emoji', 'color') + ['sort_order' => $i + 1]
            );
        }
    }

    /**
     * Oil & gas job categories, as parent groups with sub-disciplines.
     *
     * Sub-category slugs are matched against the categories seeded before
     * this rewrite (e.g. old "Drilling", "Production Engineering", "HSE")
     * so jobs already pointing at those ids stay attached under the new
     * grouping rather than being orphaned onto a fresh row.
     */
    private function seedJobCategories(): void
    {
        $groups = [
            'Engineering' => ['🛠️', '#3b82f6', [
                'Petroleum Engineering',
                'Mechanical Engineering',
                'Electrical Engineering',
                'Chemical Engineering',
                'Process Engineering',
            ]],
            'Drilling & Well Operations' => ['🛢️', '#8b5cf6', [
                'Drilling',
                'Well Engineering',
                'Completions',
                'Well Services',
                'Rig Operations',
            ]],
            'Production & Operations' => ['🏭', '#10b981', [
                'Production Engineering',
                'Field Operations',
                'Production Operations',
                'Operations Management',
                'Plant Operations',
            ]],
            'HSE & Environmental' => ['🦺', '#f59e0b', [
                'Health & Safety',
                'HSE Engineering',
                'Process Safety',
                'Environmental',
                'Emergency Response',
            ]],
            'Pipeline Engineering & Operations' => ['🚧', '#ef4444', [
                'Pipeline Engineering',
                'Pipeline Operations',
                'Pipeline Construction',
                'Pipeline Integrity',
                'Pipeline Inspection',
                'Corrosion Control',
                'Pipeline Maintenance',
                'Piping Engineering',
                'Pipeline Projects',
                'Offshore/Subsea Pipelines',
            ]],
            'Instrument Technicians' => ['🎛️', '#6366f1', [
                'Maintenance, Reliability & Inspection',
                'Mechanical Maintenance',
                'Electrical Maintenance',
                'Reliability Engineering',
                'Inspection',
                'NDT / Integrity',
            ]],
            'Geoscience & Exploration' => ['🌍', '#14b8a6', [
                'Geology',
                'Geophysics',
                'Reservoir Engineering',
                'Exploration',
                'Seismic',
            ]],
            'Projects, Procurement & Supply Chain' => ['🚚', '#eab308', [
                'Project Management',
                'Project Engineering',
                'Planning & Scheduling',
                'Procurement',
                'Supply Chain & Logistics',
            ]],
        ];

        $groupIndex = 0;

        foreach ($groups as $groupName => [$emoji, $color, $children]) {
            $groupIndex++;

            $parent = JobCategory::updateOrCreate(
                ['slug' => Str::slug($groupName)],
                [
                    'name' => $groupName,
                    'description' => "{$groupName} roles across the energy sector",
                    'emoji' => $emoji,
                    'color' => $color,
                    'parent_id' => null,
                    'sort_order' => $groupIndex,
                    'is_featured' => true,
                ]
            );

            foreach ($children as $childIndex => $childName) {
                JobCategory::updateOrCreate(
                    ['slug' => Str::slug($childName)],
                    [
                        'name' => $childName,
                        'description' => "{$childName} jobs",
                        'emoji' => $emoji,
                        'color' => $color,
                        'parent_id' => $parent->id,
                        'sort_order' => $childIndex + 1,
                        'is_featured' => false,
                    ]
                );
            }
        }
    }

    private function seedArticleCategories(): void
    {
        $rows = [
            ['Oil & Gas', '#3b82f6'],
            ['Renewable Energy', '#10b981'],
            ['LNG', '#8b5cf6'],
            ['HSE', '#f59e0b'],
            ['Solar Energy', '#14b8a6'],
            ['Power Generation', '#a855f7'],
            ['Technology', '#6366f1'],
            ['Careers & Advice', '#ec4899'],
            ['Market Insights', '#0ea5e9'],
        ];

        foreach ($rows as $i => [$name, $color]) {
            ArticleCategory::updateOrCreate(
                ['slug' => Str::slug($name).'-articles'],
                ['name' => $name, 'color' => $color, 'sort_order' => $i + 1]
            );
        }
    }

    private function seedCountriesAndCities(): void
    {
        // Country => [code, region, flag, [cities...]]
        $rows = [
            'United States' => ['US', 'North America', '🇺🇸', ['Houston' => 'Texas', 'San Ramon' => 'California', 'Midland' => 'Texas', 'Anchorage' => 'Alaska']],
            'United Kingdom' => ['GB', 'Europe', '🇬🇧', ['London' => 'England', 'Aberdeen' => 'Scotland', 'Manchester' => 'England']],
            'Canada' => ['CA', 'North America', '🇨🇦', ['Calgary' => 'Alberta', 'Edmonton' => 'Alberta', "St. John's" => 'Newfoundland']],
            'United Arab Emirates' => ['AE', 'Middle East', '🇦🇪', ['Dubai' => 'Dubai', 'Abu Dhabi' => 'Abu Dhabi', 'Sharjah' => 'Sharjah']],
            'Saudi Arabia' => ['SA', 'Middle East', '🇸🇦', ['Dhahran' => 'Eastern Province', 'Riyadh' => 'Riyadh', 'Jubail' => 'Eastern Province']],
            'Qatar' => ['QA', 'Middle East', '🇶🇦', ['Doha' => 'Doha', 'Ras Laffan' => 'Al Khor']],
            'Australia' => ['AU', 'Oceania', '🇦🇺', ['Perth' => 'Western Australia', 'Melbourne' => 'Victoria', 'Brisbane' => 'Queensland']],
            'Germany' => ['DE', 'Europe', '🇩🇪', ['Berlin' => 'Berlin', 'Frankfurt' => 'Hesse', 'Hamburg' => 'Hamburg']],
            'France' => ['FR', 'Europe', '🇫🇷', ['Paris' => 'Île-de-France', 'Lyon' => 'Auvergne-Rhône-Alpes']],
            'Netherlands' => ['NL', 'Europe', '🇳🇱', ['Amsterdam' => 'North Holland', 'Rotterdam' => 'South Holland']],
            'Norway' => ['NO', 'Europe', '🇳🇴', ['Stavanger' => 'Rogaland', 'Oslo' => 'Oslo', 'Bergen' => 'Vestland']],
            'India' => ['IN', 'Asia', '🇮🇳', ['Mumbai' => 'Maharashtra', 'Delhi' => 'Delhi', 'Chennai' => 'Tamil Nadu']],
            'Singapore' => ['SG', 'Asia', '🇸🇬', ['Singapore' => null]],
            'Malaysia' => ['MY', 'Asia', '🇲🇾', ['Kuala Lumpur' => 'Federal Territory', 'Miri' => 'Sarawak']],
            'Italy' => ['IT', 'Europe', '🇮🇹', ['Milan' => 'Lombardy', 'Rome' => 'Lazio']],
            'Nigeria' => ['NG', 'Africa', '🇳🇬', ['Lagos' => 'Lagos', 'Port Harcourt' => 'Rivers']],
            'Brazil' => ['BR', 'South America', '🇧🇷', ['Rio de Janeiro' => 'Rio de Janeiro', 'Macaé' => 'Rio de Janeiro']],
        ];

        $order = 0;

        foreach ($rows as $name => [$code, $region, $flag, $cities]) {
            $country = Country::updateOrCreate(
                ['code' => $code],
                [
                    'name' => $name,
                    'slug' => Str::slug($name),
                    'region' => $region,
                    'flag_emoji' => $flag,
                    'sort_order' => ++$order,
                ]
            );

            $cityOrder = 0;

            foreach ($cities as $cityName => $cityRegion) {
                City::updateOrCreate(
                    ['country_id' => $country->id, 'slug' => Str::slug($cityName)],
                    ['name' => $cityName, 'region' => $cityRegion, 'sort_order' => ++$cityOrder]
                );
            }
        }
    }

    private function seedSkills(): void
    {
        // Energy-sector skills rather than the generic software list in the
        // frontend mock data — this is an oil, gas and energy portal.
        $rows = [
            ['Drilling Operations', 'Drilling', 'very_high'],
            ['Well Control', 'Drilling', 'very_high'],
            ['Directional Drilling', 'Drilling', 'high'],
            ['Mud Engineering', 'Drilling', 'medium'],
            ['HSE Management', 'Safety', 'very_high'],
            ['Process Safety', 'Safety', 'very_high'],
            ['Risk Assessment', 'Safety', 'high'],
            ['Reservoir Engineering', 'Subsurface', 'high'],
            ['Petrophysics', 'Subsurface', 'medium'],
            ['Seismic Interpretation', 'Subsurface', 'medium'],
            ['Pipeline Integrity', 'Engineering', 'high'],
            ['Rotating Equipment', 'Engineering', 'high'],
            ['Instrumentation & Control', 'Engineering', 'high'],
            ['SCADA Systems', 'Engineering', 'medium'],
            ['Project Management', 'Management', 'very_high'],
            ['Contract Management', 'Management', 'medium'],
            ['AutoCAD', 'Software', 'high'],
            ['Petrel', 'Software', 'high'],
            ['Aspen HYSYS', 'Software', 'high'],
            ['SAP', 'Software', 'medium'],
            ['Offshore Operations', 'Operations', 'high'],
            ['LNG Processing', 'Operations', 'high'],
            ['Solar PV Design', 'Renewables', 'high'],
            ['Wind Turbine Maintenance', 'Renewables', 'high'],
            ['Energy Auditing', 'Renewables', 'medium'],
        ];

        foreach ($rows as $i => [$name, $category, $demand]) {
            Skill::updateOrCreate(
                ['slug' => Str::slug($name)],
                [
                    'name' => $name,
                    'category' => $category,
                    'demand_level' => $demand,
                    'sort_order' => $i + 1,
                ]
            );
        }
    }

    private function seedTags(): void
    {
        $rows = [
            ['Remote', '#3b82f6'],
            ['Full Time', '#10b981'],
            ['Contract', '#f59e0b'],
            ['Part Time', '#06b6d4'],
            ['Entry Level', '#8b5cf6'],
            ['Senior Level', '#ef4444'],
            ['Internship', '#f97316'],
            ['Urgent Hiring', '#3b82f6'],
            ['Top Company', '#eab308'],
            ['Featured', '#ef4444'],
            ['Offshore', '#0ea5e9'],
            ['Rotational', '#14b8a6'],
        ];

        foreach ($rows as [$name, $color]) {
            Tag::updateOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name, 'color' => $color]
            );
        }
    }
}
