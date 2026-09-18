"use client";

import TaxonomyScreen from "@/components/admin/TaxonomyScreen";
import { adminTaxonomy } from "@/lib/api/endpoints";

export default function CountriesPage() {
  return (
    <TaxonomyScreen
      navKey="countries"
      title="Countries"
      noun="countries"
      singular="Country"
      api={adminTaxonomy.countries}
      fields={[
        {
          name: "name",
          label: "Country Name",
          required: true,
          placeholder: "e.g. Norway",
        },
        {
          name: "code",
          label: "ISO Code",
          required: true,
          placeholder: "NO",
          hint: "Exactly two letters, as in the ISO 3166-1 alpha-2 standard.",
        },
        {
          name: "region",
          label: "Region",
          placeholder: "e.g. Europe",
          nullable: true,
        },
        {
          name: "phone_code",
          label: "Phone Code",
          placeholder: "+47",
          nullable: true,
        },
        {
          name: "currency_code",
          label: "Currency Code",
          placeholder: "NOK",
          hint: "Three letters.",
          nullable: true,
        },
        {
          name: "flag_emoji",
          label: "Flag",
          placeholder: "🇳🇴",
          nullable: true,
        },
        { name: "sort_order", label: "Sort Order", type: "number" },
        { name: "is_active", label: "Active", type: "checkbox" },
      ]}
      statLabels={{
        total: "Total Countries",
        active: "Active",
        inactive: "Inactive",
        jobs: "Total Jobs",
      }}
      columns={[
        { header: "Code", render: (c) => c.code ?? "—" },
        { header: "Region", render: (c) => c.region ?? "—" },
      ]}
      tips={[
        "Set the order to control how countries appear in dropdowns.",
        "Inactive countries are hidden from the public site but keep their data.",
        "A country with cities or jobs attached cannot be deleted — deactivate it instead.",
      ]}
    />
  );
}
