"use client";

import TaxonomyScreen from "@/components/admin/TaxonomyScreen";
import { adminTaxonomy } from "@/lib/api/endpoints";

export default function JobCategoriesPage() {
  return (
    <TaxonomyScreen
      navKey="categories"
      title="Job Categories"
      noun="categories"
      api={adminTaxonomy.jobCategories}
      statLabels={{
        total: "Total Categories",
        active: "Active",
        inactive: "Inactive",
        jobs: "Total Jobs",
        featured: "Featured",
      }}
      columns={[
        { header: "Slug", render: (c) => c.slug },
        {
          header: "Featured",
          render: (c) =>
            c.is_featured ? (
              <span className="text-xs font-medium text-amber-600">Featured</span>
            ) : (
              <span className="text-slate-300">—</span>
            ),
        },
      ]}
      tips={[
        "Job categories organise listings and drive the search experience.",
        "Featured categories appear on the homepage.",
        "Inactive categories are hidden from the frontend; their jobs are unaffected.",
      ]}
    />
  );
}
