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
        $this->seedRemainingCountries();
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
     *
     * Re-running this is how the structure below is restored after it has
     * been edited by hand, so it also has to undo what those edits left
     * behind — see unfeatureCategoriesOutsideGroups() at the end.
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

        // An earlier run of this seeder, before group and child slugs were
        // kept apart, left rows pointing at themselves — see the child loop
        // below. Detaching them first lets the rows be claimed as groups
        // again, rather than staying invisible as their own children.
        JobCategory::whereColumn('parent_id', 'id')->update(['parent_id' => null]);

        $groupIndex = 0;
        $groupIds = [];

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

            $groupIds[] = $parent->id;

            foreach ($children as $childIndex => $childName) {
                /*
                 * Str::slug drops "&", so a child can slugify to exactly what
                 * its own group did — "Production Operations" collides with
                 * the group "Production & Operations". updateOrCreate then
                 * matches the group's own row and rewrites it as a child of
                 * itself, taking the group off the homepage and stranding the
                 * other four children under a self-parented row.
                 *
                 * The group keeps the bare slug, since that is what the
                 * frontend's icon map and existing links already use; the
                 * child takes a suffixed one.
                 */
                $childSlug = Str::slug($childName);

                if ($childSlug === Str::slug($groupName)) {
                    $childSlug .= '-discipline';
                }

                JobCategory::updateOrCreate(
                    ['slug' => $childSlug],
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

        $this->unfeatureCategoriesOutsideGroups($groupIds);
    }

    /**
     * Leaves the eight groups above as the only featured categories.
     *
     * The homepage tiles are exactly the featured top-level categories, so
     * anything else still carrying the flag shows up beside them. That is
     * how the live site ended up with a tile for "Drilling" (a sub-category
     * promoted by hand) and a second "Projects, Procurement & Supply Chain"
     * — a row renamed in the admin panel whose slug still said
     * human-resources, which this seeder cannot match by slug and so never
     * corrects.
     *
     * Only the flag is touched. The rows keep their names, slugs and jobs,
     * so nothing an employer posted is lost by running this.
     *
     * @param  array<int, int>  $groupIds
     */
    private function unfeatureCategoriesOutsideGroups(array $groupIds): void
    {
        JobCategory::query()
            ->whereNotIn('id', $groupIds)
            ->where('is_featured', true)
            ->update(['is_featured' => false]);
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

    /**
     * Every other country, so the filter covers the whole world.
     *
     * updateOrCreate() keys on `code`, the same as seedCountriesAndCities()
     * above, so the 17 energy-market countries already seeded are matched
     * and left alone rather than duplicated — this only adds what is
     * missing. No cities: a country with no jobs yet gets none until an
     * employer or an admin adds one, rather than a made-up list.
     */
    private function seedRemainingCountries(): void
    {
        $rows = [
            'Afghanistan' => ['AF', 'Asia', '🇦🇫'],
            'Albania' => ['AL', 'Europe', '🇦🇱'],
            'Algeria' => ['DZ', 'Africa', '🇩🇿'],
            'Andorra' => ['AD', 'Europe', '🇦🇩'],
            'Angola' => ['AO', 'Africa', '🇦🇴'],
            'Antigua and Barbuda' => ['AG', 'North America', '🇦🇬'],
            'Argentina' => ['AR', 'South America', '🇦🇷'],
            'Armenia' => ['AM', 'Asia', '🇦🇲'],
            'Austria' => ['AT', 'Europe', '🇦🇹'],
            'Azerbaijan' => ['AZ', 'Asia', '🇦🇿'],
            'Bahamas' => ['BS', 'North America', '🇧🇸'],
            'Bahrain' => ['BH', 'Middle East', '🇧🇭'],
            'Bangladesh' => ['BD', 'Asia', '🇧🇩'],
            'Barbados' => ['BB', 'North America', '🇧🇧'],
            'Belarus' => ['BY', 'Europe', '🇧🇾'],
            'Belgium' => ['BE', 'Europe', '🇧🇪'],
            'Belize' => ['BZ', 'North America', '🇧🇿'],
            'Benin' => ['BJ', 'Africa', '🇧🇯'],
            'Bhutan' => ['BT', 'Asia', '🇧🇹'],
            'Bolivia' => ['BO', 'South America', '🇧🇴'],
            'Bosnia and Herzegovina' => ['BA', 'Europe', '🇧🇦'],
            'Botswana' => ['BW', 'Africa', '🇧🇼'],
            'Brunei' => ['BN', 'Asia', '🇧🇳'],
            'Bulgaria' => ['BG', 'Europe', '🇧🇬'],
            'Burkina Faso' => ['BF', 'Africa', '🇧🇫'],
            'Burundi' => ['BI', 'Africa', '🇧🇮'],
            'Cabo Verde' => ['CV', 'Africa', '🇨🇻'],
            'Cambodia' => ['KH', 'Asia', '🇰🇭'],
            'Cameroon' => ['CM', 'Africa', '🇨🇲'],
            'Central African Republic' => ['CF', 'Africa', '🇨🇫'],
            'Chad' => ['TD', 'Africa', '🇹🇩'],
            'Chile' => ['CL', 'South America', '🇨🇱'],
            'China' => ['CN', 'Asia', '🇨🇳'],
            'Colombia' => ['CO', 'South America', '🇨🇴'],
            'Comoros' => ['KM', 'Africa', '🇰🇲'],
            'Congo' => ['CG', 'Africa', '🇨🇬'],
            'Costa Rica' => ['CR', 'North America', '🇨🇷'],
            'Croatia' => ['HR', 'Europe', '🇭🇷'],
            'Cuba' => ['CU', 'North America', '🇨🇺'],
            'Cyprus' => ['CY', 'Europe', '🇨🇾'],
            'Czech Republic' => ['CZ', 'Europe', '🇨🇿'],
            'Democratic Republic of the Congo' => ['CD', 'Africa', '🇨🇩'],
            'Denmark' => ['DK', 'Europe', '🇩🇰'],
            'Djibouti' => ['DJ', 'Africa', '🇩🇯'],
            'Dominica' => ['DM', 'North America', '🇩🇲'],
            'Dominican Republic' => ['DO', 'North America', '🇩🇴'],
            'Ecuador' => ['EC', 'South America', '🇪🇨'],
            'Egypt' => ['EG', 'Africa', '🇪🇬'],
            'El Salvador' => ['SV', 'North America', '🇸🇻'],
            'Equatorial Guinea' => ['GQ', 'Africa', '🇬🇶'],
            'Eritrea' => ['ER', 'Africa', '🇪🇷'],
            'Estonia' => ['EE', 'Europe', '🇪🇪'],
            'Eswatini' => ['SZ', 'Africa', '🇸🇿'],
            'Ethiopia' => ['ET', 'Africa', '🇪🇹'],
            'Fiji' => ['FJ', 'Oceania', '🇫🇯'],
            'Finland' => ['FI', 'Europe', '🇫🇮'],
            'Gabon' => ['GA', 'Africa', '🇬🇦'],
            'Gambia' => ['GM', 'Africa', '🇬🇲'],
            'Georgia' => ['GE', 'Asia', '🇬🇪'],
            'Ghana' => ['GH', 'Africa', '🇬🇭'],
            'Greece' => ['GR', 'Europe', '🇬🇷'],
            'Grenada' => ['GD', 'North America', '🇬🇩'],
            'Guatemala' => ['GT', 'North America', '🇬🇹'],
            'Guinea' => ['GN', 'Africa', '🇬🇳'],
            'Guinea-Bissau' => ['GW', 'Africa', '🇬🇼'],
            'Guyana' => ['GY', 'South America', '🇬🇾'],
            'Haiti' => ['HT', 'North America', '🇭🇹'],
            'Honduras' => ['HN', 'North America', '🇭🇳'],
            'Hong Kong' => ['HK', 'Asia', '🇭🇰'],
            'Hungary' => ['HU', 'Europe', '🇭🇺'],
            'Iceland' => ['IS', 'Europe', '🇮🇸'],
            'Indonesia' => ['ID', 'Asia', '🇮🇩'],
            'Iran' => ['IR', 'Middle East', '🇮🇷'],
            'Iraq' => ['IQ', 'Middle East', '🇮🇶'],
            'Ireland' => ['IE', 'Europe', '🇮🇪'],
            'Israel' => ['IL', 'Middle East', '🇮🇱'],
            'Ivory Coast' => ['CI', 'Africa', '🇨🇮'],
            'Jamaica' => ['JM', 'North America', '🇯🇲'],
            'Japan' => ['JP', 'Asia', '🇯🇵'],
            'Jordan' => ['JO', 'Middle East', '🇯🇴'],
            'Kazakhstan' => ['KZ', 'Asia', '🇰🇿'],
            'Kenya' => ['KE', 'Africa', '🇰🇪'],
            'Kiribati' => ['KI', 'Oceania', '🇰🇮'],
            'Kosovo' => ['XK', 'Europe', '🇽🇰'],
            'Kuwait' => ['KW', 'Middle East', '🇰🇼'],
            'Kyrgyzstan' => ['KG', 'Asia', '🇰🇬'],
            'Laos' => ['LA', 'Asia', '🇱🇦'],
            'Latvia' => ['LV', 'Europe', '🇱🇻'],
            'Lebanon' => ['LB', 'Middle East', '🇱🇧'],
            'Lesotho' => ['LS', 'Africa', '🇱🇸'],
            'Liberia' => ['LR', 'Africa', '🇱🇷'],
            'Libya' => ['LY', 'Africa', '🇱🇾'],
            'Liechtenstein' => ['LI', 'Europe', '🇱🇮'],
            'Lithuania' => ['LT', 'Europe', '🇱🇹'],
            'Luxembourg' => ['LU', 'Europe', '🇱🇺'],
            'Madagascar' => ['MG', 'Africa', '🇲🇬'],
            'Malawi' => ['MW', 'Africa', '🇲🇼'],
            'Maldives' => ['MV', 'Asia', '🇲🇻'],
            'Mali' => ['ML', 'Africa', '🇲🇱'],
            'Malta' => ['MT', 'Europe', '🇲🇹'],
            'Marshall Islands' => ['MH', 'Oceania', '🇲🇭'],
            'Mauritania' => ['MR', 'Africa', '🇲🇷'],
            'Mauritius' => ['MU', 'Africa', '🇲🇺'],
            'Mexico' => ['MX', 'North America', '🇲🇽'],
            'Micronesia' => ['FM', 'Oceania', '🇫🇲'],
            'Moldova' => ['MD', 'Europe', '🇲🇩'],
            'Monaco' => ['MC', 'Europe', '🇲🇨'],
            'Mongolia' => ['MN', 'Asia', '🇲🇳'],
            'Montenegro' => ['ME', 'Europe', '🇲🇪'],
            'Morocco' => ['MA', 'Africa', '🇲🇦'],
            'Mozambique' => ['MZ', 'Africa', '🇲🇿'],
            'Myanmar' => ['MM', 'Asia', '🇲🇲'],
            'Namibia' => ['NA', 'Africa', '🇳🇦'],
            'Nauru' => ['NR', 'Oceania', '🇳🇷'],
            'Nepal' => ['NP', 'Asia', '🇳🇵'],
            'New Zealand' => ['NZ', 'Oceania', '🇳🇿'],
            'Nicaragua' => ['NI', 'North America', '🇳🇮'],
            'Niger' => ['NE', 'Africa', '🇳🇪'],
            'North Korea' => ['KP', 'Asia', '🇰🇵'],
            'North Macedonia' => ['MK', 'Europe', '🇲🇰'],
            'Oman' => ['OM', 'Middle East', '🇴🇲'],
            'Pakistan' => ['PK', 'Asia', '🇵🇰'],
            'Palau' => ['PW', 'Oceania', '🇵🇼'],
            'Palestine' => ['PS', 'Middle East', '🇵🇸'],
            'Panama' => ['PA', 'North America', '🇵🇦'],
            'Papua New Guinea' => ['PG', 'Oceania', '🇵🇬'],
            'Paraguay' => ['PY', 'South America', '🇵🇾'],
            'Peru' => ['PE', 'South America', '🇵🇪'],
            'Philippines' => ['PH', 'Asia', '🇵🇭'],
            'Poland' => ['PL', 'Europe', '🇵🇱'],
            'Portugal' => ['PT', 'Europe', '🇵🇹'],
            'Romania' => ['RO', 'Europe', '🇷🇴'],
            'Russia' => ['RU', 'Europe', '🇷🇺'],
            'Rwanda' => ['RW', 'Africa', '🇷🇼'],
            'Saint Kitts and Nevis' => ['KN', 'North America', '🇰🇳'],
            'Saint Lucia' => ['LC', 'North America', '🇱🇨'],
            'Saint Vincent and the Grenadines' => ['VC', 'North America', '🇻🇨'],
            'Samoa' => ['WS', 'Oceania', '🇼🇸'],
            'San Marino' => ['SM', 'Europe', '🇸🇲'],
            'Sao Tome and Principe' => ['ST', 'Africa', '🇸🇹'],
            'Senegal' => ['SN', 'Africa', '🇸🇳'],
            'Serbia' => ['RS', 'Europe', '🇷🇸'],
            'Seychelles' => ['SC', 'Africa', '🇸🇨'],
            'Sierra Leone' => ['SL', 'Africa', '🇸🇱'],
            'Slovakia' => ['SK', 'Europe', '🇸🇰'],
            'Slovenia' => ['SI', 'Europe', '🇸🇮'],
            'Solomon Islands' => ['SB', 'Oceania', '🇸🇧'],
            'Somalia' => ['SO', 'Africa', '🇸🇴'],
            'South Africa' => ['ZA', 'Africa', '🇿🇦'],
            'South Korea' => ['KR', 'Asia', '🇰🇷'],
            'South Sudan' => ['SS', 'Africa', '🇸🇸'],
            'Spain' => ['ES', 'Europe', '🇪🇸'],
            'Sri Lanka' => ['LK', 'Asia', '🇱🇰'],
            'Sudan' => ['SD', 'Africa', '🇸🇩'],
            'Suriname' => ['SR', 'South America', '🇸🇷'],
            'Sweden' => ['SE', 'Europe', '🇸🇪'],
            'Switzerland' => ['CH', 'Europe', '🇨🇭'],
            'Syria' => ['SY', 'Middle East', '🇸🇾'],
            'Taiwan' => ['TW', 'Asia', '🇹🇼'],
            'Tajikistan' => ['TJ', 'Asia', '🇹🇯'],
            'Tanzania' => ['TZ', 'Africa', '🇹🇿'],
            'Thailand' => ['TH', 'Asia', '🇹🇭'],
            'Timor-Leste' => ['TL', 'Asia', '🇹🇱'],
            'Togo' => ['TG', 'Africa', '🇹🇬'],
            'Tonga' => ['TO', 'Oceania', '🇹🇴'],
            'Trinidad and Tobago' => ['TT', 'North America', '🇹🇹'],
            'Tunisia' => ['TN', 'Africa', '🇹🇳'],
            'Turkey' => ['TR', 'Asia', '🇹🇷'],
            'Turkmenistan' => ['TM', 'Asia', '🇹🇲'],
            'Tuvalu' => ['TV', 'Oceania', '🇹🇻'],
            'Uganda' => ['UG', 'Africa', '🇺🇬'],
            'Ukraine' => ['UA', 'Europe', '🇺🇦'],
            'Uruguay' => ['UY', 'South America', '🇺🇾'],
            'Uzbekistan' => ['UZ', 'Asia', '🇺🇿'],
            'Vanuatu' => ['VU', 'Oceania', '🇻🇺'],
            'Vatican City' => ['VA', 'Europe', '🇻🇦'],
            'Venezuela' => ['VE', 'South America', '🇻🇪'],
            'Vietnam' => ['VN', 'Asia', '🇻🇳'],
            'Yemen' => ['YE', 'Middle East', '🇾🇪'],
            'Zambia' => ['ZM', 'Africa', '🇿🇲'],
            'Zimbabwe' => ['ZW', 'Africa', '🇿🇼'],
        ];

        $order = Country::query()->max('sort_order') ?? 0;

        foreach ($rows as $name => [$code, $region, $flag]) {
            // withTrashed(): a country soft-deleted earlier still holds its
            // code and slug, and a plain updateOrCreate() can't see past that
            // scope — it would try to insert a fresh row and collide with the
            // slug the trashed one still owns.
            Country::withTrashed()->updateOrCreate(
                ['code' => $code],
                [
                    'name' => $name,
                    'slug' => Str::slug($name),
                    'region' => $region,
                    'flag_emoji' => $flag,
                    'sort_order' => ++$order,
                    'deleted_at' => null,
                ]
            );
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
