"use client";

import TaxonomyScreen from "@/components/admin/TaxonomyScreen";
import { adminTaxonomy } from "@/lib/api/endpoints";

const DEMAND_STYLE: Record<string, string> = {
  very_high: "bg-red-50 text-red-600",
  high: "bg-orange-50 text-orange-600",
  medium: "bg-blue-50 text-blue-600",
  low: "bg-slate-100 text-slate-500",
};

const DEMAND_LABEL: Record<string, string> = {
  very_high: "Very High",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export default function SkillsPage() {
  return (
    <TaxonomyScreen
      navKey="skills"
      title="Skills"
      noun="skills"
      singular="Skill"
      api={adminTaxonomy.skills}
      fields={[
        {
          name: "name",
          label: "Skill Name",
          required: true,
          placeholder: "e.g. Well Integrity",
        },
        {
          name: "category",
          label: "Category",
          placeholder: "e.g. Drilling",
          nullable: true,
        },
        {
          name: "demand_level",
          label: "Demand Level",
          type: "select",
          options: [
            { value: "low", label: "Low" },
            { value: "medium", label: "Medium" },
            { value: "high", label: "High" },
            { value: "very_high", label: "Very High" },
          ],
        },
        { name: "icon", label: "Icon", placeholder: "⚙️", nullable: true },
        { name: "color", label: "Colour", type: "color", nullable: true },
        { name: "sort_order", label: "Sort Order", type: "number" },
        { name: "is_active", label: "Active", type: "checkbox" },
      ]}
      statLabels={{
        total: "Total Skills",
        active: "Active",
        inactive: "Inactive",
        in_demand: "In Demand",
        jobs: "Jobs Using Skills",
      }}
      columns={[
        { header: "Category", render: (s) => s.category ?? "—" },
        {
          header: "Demand",
          render: (s) => (
            <span
              className={`text-xs font-medium px-2 py-1 rounded ${DEMAND_STYLE[s.demand_level ?? "medium"]}`}
            >
              {DEMAND_LABEL[s.demand_level ?? "medium"]}
            </span>
          ),
        },
      ]}
      tips={[
        "High and very high demand skills are counted in the In Demand figure.",
        "Inactive skills are hidden from job forms and search filters.",
        "A skill attached to a job cannot be deleted — deactivate it instead.",
      ]}
    />
  );
}
