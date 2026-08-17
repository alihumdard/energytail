"use client";

import TaxonomyScreen from "@/components/admin/TaxonomyScreen";
import { adminTaxonomy } from "@/lib/api/endpoints";

export default function IndustriesPage() {
  return (
    <TaxonomyScreen
      navKey="industries"
      title="Industries"
      noun="industries"
      api={adminTaxonomy.industries}
      statLabels={{ total: "Total Industries", active: "Active", inactive: "Inactive", jobs: "Total Jobs" }}
      columns={[{ header: "Slug", render: (i) => i.slug }]}
      tips={[
        "Set the order to control how industries appear on the frontend.",
        "Inactive industries are hidden from users but keep their jobs.",
        "The slug is fixed once created, so landing page URLs and inbound links keep working.",
      ]}
    />
  );
}
