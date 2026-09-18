"use client";

import TaxonomyScreen from "@/components/admin/TaxonomyScreen";
import { adminTaxonomy } from "@/lib/api/endpoints";

export default function IndustriesPage() {
  return (
    <TaxonomyScreen
      navKey="industries"
      title="Industries"
      noun="industries"
      singular="Industry"
      api={adminTaxonomy.industries}
      fields={[
        {
          name: "name",
          label: "Industry Name",
          required: true,
          placeholder: "e.g. Offshore Wind",
        },
        {
          name: "description",
          label: "Description",
          type: "textarea",
          nullable: true,
        },
        {
          name: "emoji",
          label: "Emoji",
          hint: "A single emoji shown beside the name.",
          nullable: true,
        },
        { name: "color", label: "Colour", type: "color", nullable: true },
        { name: "sort_order", label: "Sort Order", type: "number" },
        { name: "is_active", label: "Active", type: "checkbox" },
      ]}
      statLabels={{
        total: "Total Industries",
        active: "Active",
        inactive: "Inactive",
        jobs: "Total Jobs",
      }}
      columns={[{ header: "Slug", render: (i) => i.slug }]}
      tips={[
        "Set the order to control how industries appear on the frontend.",
        "Inactive industries are hidden from users but keep their jobs.",
        "The slug is fixed once created, so landing page URLs and inbound links keep working.",
      ]}
    />
  );
}
