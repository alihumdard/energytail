"use client";

import TaxonomyScreen from "@/components/admin/TaxonomyScreen";
import { adminTaxonomy } from "@/lib/api/endpoints";

export default function TagsPage() {
  return (
    <TaxonomyScreen
      navKey="tags"
      title="Tags"
      noun="tags"
      singular="Tag"
      api={adminTaxonomy.tags}
      fields={[
        {
          name: "name",
          label: "Tag Name",
          required: true,
          placeholder: "e.g. Hydrogen",
        },
        { name: "color", label: "Colour", type: "color", nullable: true },
        { name: "is_active", label: "Active", type: "checkbox" },
      ]}
      statLabels={{
        total: "Total Tags",
        active: "Active",
        inactive: "Inactive",
        in_use: "In Use",
        assignments: "Assignments",
      }}
      columns={[
        {
          header: "Colour",
          render: (t) => (
            <span className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded shrink-0 border border-slate-200"
                style={{ backgroundColor: t.color ?? "#cbd5e1" }}
              />
              <span className="text-xs text-slate-400">{t.color ?? "—"}</span>
            </span>
          ),
        },
        {
          header: "Usage",
          render: (t) => (t.usage_count ?? 0).toLocaleString(),
        },
      ]}
      tips={[
        "Tags are shared between jobs and articles.",
        "The table is ordered by usage, so the most-applied tags surface first.",
        "Inactive tags stay attached to their records but are hidden from the frontend.",
      ]}
    />
  );
}
