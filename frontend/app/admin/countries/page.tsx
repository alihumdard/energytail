"use client";

import TaxonomyScreen from "@/components/admin/TaxonomyScreen";
import { adminTaxonomy } from "@/lib/api/endpoints";

export default function CountriesPage() {
  return (
    <TaxonomyScreen
      navKey="countries"
      title="Countries"
      noun="countries"
      api={adminTaxonomy.countries}
      statLabels={{ total: "Total Countries", active: "Active", inactive: "Inactive", jobs: "Total Jobs" }}
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
