"use client";

import TaxonomyScreen from "@/components/admin/TaxonomyScreen";
import { adminTaxonomy } from "@/lib/api/endpoints";

export default function JobCategoriesPage() {
  return (
    <TaxonomyScreen
      navKey="categories"
      title="Job Categories"
      noun="categories"
      singular="Category"
      api={adminTaxonomy.jobCategories}
      fields={[
        {
          name: "name",
          label: "Category Name",
          required: true,
          placeholder: "e.g. Subsea Engineering",
        },
        {
          name: "description",
          label: "Description",
          type: "textarea",
          nullable: true,
        },
        {
          name: "parent_id",
          label: "Parent Category",
          type: "select",
          placeholder: "None - top level",
          hint: "Leave empty for a top-level category.",
          loadOptions: async () => {
            const { data } = await adminTaxonomy.jobCategories.list({
              per_page: 100,
            });
            return data.map((c) => ({ value: c.id, label: c.name }));
          },
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
        { name: "is_featured", label: "Featured", type: "checkbox" },
      ]}
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
              <span className="text-xs font-medium text-amber-600">
                Featured
              </span>
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
