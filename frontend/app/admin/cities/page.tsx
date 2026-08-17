"use client";

import TaxonomyScreen from "@/components/admin/TaxonomyScreen";
import { adminTaxonomy } from "@/lib/api/endpoints";

export default function CitiesPage() {
  return (
    <TaxonomyScreen
      navKey="cities"
      title="Cities"
      noun="cities"
      api={adminTaxonomy.cities}
      statLabels={{ total: "Total Cities", active: "Active", inactive: "Inactive", jobs: "Total Jobs" }}
      columns={[
        {
          header: "Country",
          render: (c) =>
            c.country ? (
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span>{c.country.flag_emoji}</span>
                {c.country.name}
              </span>
            ) : (
              "—"
            ),
        },
        { header: "Region", render: (c) => c.region ?? "—" },
      ]}
      tips={[
        "Cities belong to a country, and their slug is unique per country.",
        "Inactive cities will not appear in job search filters.",
        "Jobs and companies are linked to cities, so a city in use cannot be deleted.",
      ]}
    />
  );
}
