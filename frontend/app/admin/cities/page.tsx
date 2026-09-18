"use client";

import TaxonomyScreen from "@/components/admin/TaxonomyScreen";
import { adminTaxonomy } from "@/lib/api/endpoints";

export default function CitiesPage() {
  return (
    <TaxonomyScreen
      navKey="cities"
      title="Cities"
      noun="cities"
      singular="City"
      api={adminTaxonomy.cities}
      fields={[
        {
          name: "name",
          label: "City Name",
          required: true,
          placeholder: "e.g. Stavanger",
        },
        {
          name: "country_id",
          label: "Country",
          type: "select",
          required: true,
          placeholder: "Choose a country…",
          // Read from the API rather than hard-coded: the country list is
          // itself editable on the screen next door.
          loadOptions: async () => {
            const { data } = await adminTaxonomy.countries.list({
              per_page: 100,
            });
            return data.map((c) => ({ value: c.id, label: c.name }));
          },
        },
        {
          name: "region",
          label: "Region",
          placeholder: "e.g. Rogaland",
          nullable: true,
        },
        {
          name: "latitude",
          label: "Latitude",
          type: "number",
          placeholder: "58.97",
          nullable: true,
        },
        {
          name: "longitude",
          label: "Longitude",
          type: "number",
          placeholder: "5.73",
          nullable: true,
        },
        { name: "sort_order", label: "Sort Order", type: "number" },
        { name: "is_active", label: "Active", type: "checkbox" },
      ]}
      statLabels={{
        total: "Total Cities",
        active: "Active",
        inactive: "Inactive",
        jobs: "Total Jobs",
      }}
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
