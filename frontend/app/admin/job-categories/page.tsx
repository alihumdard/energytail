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
        {
          name: "is_featured",
          label: "Featured",
          type: "checkbox",
          hint: "Gives this category a tile on the homepage. Top-level categories only — a category with a parent will not appear there.",
        },
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
          /*
           * Only top-level categories get a homepage tile, so a featured
           * sub-category is flagged rather than shown the same as one that
           * does appear — ticking Featured on a sub-category otherwise looks
           * like the homepage ignoring it.
           */
          render: (c) =>
            c.is_featured ? (
              c.parent_id ? (
                <span
                  className="text-xs font-medium text-slate-400"
                  title="Only top-level categories appear on the homepage. Clear this one's parent to give it a tile."
                >
                  Featured (not on homepage)
                </span>
              ) : (
                <span className="text-xs font-medium text-amber-600">
                  Featured
                </span>
              )
            ) : (
              <span className="text-slate-300">—</span>
            ),
        },
      ]}
      tips={[
        "Job categories organise listings and drive the search experience.",
        "Featured top-level categories appear on the homepage. A sub-category cannot: its jobs count towards its parent's tile instead.",
        "Inactive categories are hidden from the frontend; their jobs are unaffected.",
      ]}
    />
  );
}
