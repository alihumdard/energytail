"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Save, X } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { publicApi, seekerSkills } from "@/lib/api/endpoints";
import type { SeekerSkill } from "@/lib/api/types";

/**
 * The candidate's skills.
 *
 * Chosen from the shared taxonomy rather than typed freely, so a candidate's
 * "Well Control" is the same row an employer filtered a job by — free text
 * here would make skill matching impossible.
 *
 * Edited as a whole set and saved in one call, which is what the API expects.
 */

const PROFICIENCY = ["beginner", "intermediate", "advanced", "expert"];

interface Option {
  id: number;
  name: string;
}

export default function SkillsSection({ enabled }: { enabled: boolean }) {
  const [chosen, setChosen] = useState<SeekerSkill[] | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState("");

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    seekerSkills
      .list()
      .then(({ data }) => {
        if (!cancelled) setChosen(data);
      })
      .catch(() => {
        if (!cancelled) setChosen([]);
      });

    publicApi
      .skills()
      .then(({ data }) => {
        if (!cancelled) setOptions(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  function add() {
    const id = Number(picking);
    const option = options.find((o) => o.id === id);

    if (!option || chosen === null) return;

    // Already listed: adding it again would be a duplicate the API collapses
    // anyway, so it is refused here where the reason can be shown.
    if (chosen.some((skill) => skill.skill_id === id)) {
      setPicking("");
      return;
    }

    setChosen([
      ...chosen,
      {
        skill_id: id,
        name: option.name,
        slug: "",
        proficiency: null,
        years_experience: null,
      },
    ]);
    setPicking("");
    setSaved(false);
  }

  function setProficiency(id: number, value: string) {
    setChosen((current) =>
      (current ?? []).map((skill) =>
        skill.skill_id === id
          ? { ...skill, proficiency: value || null }
          : skill,
      ),
    );
    setSaved(false);
  }

  function drop(id: number) {
    setChosen((current) =>
      (current ?? []).filter((skill) => skill.skill_id !== id),
    );
    setSaved(false);
  }

  async function save() {
    if (chosen === null) return;

    setBusy(true);
    setError(null);

    try {
      const { data } = await seekerSkills.sync(
        chosen.map((skill) => ({
          skill_id: skill.skill_id,
          proficiency: skill.proficiency,
          years_experience: skill.years_experience,
        })),
      );

      setChosen(data);
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.detail : "Could not save your skills.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5">
      <h2 className="font-semibold text-slate-900">Skills</h2>

      {chosen === null ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-slate-500">
            Picked from the same list employers filter jobs by, so the right
            roles find you.
          </p>

          <div className="mt-4 flex gap-2">
            <label htmlFor="skill-picker" className="sr-only">
              Choose a skill
            </label>
            <select
              id="skill-picker"
              value={picking}
              onChange={(event) => setPicking(event.target.value)}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Choose a skill…</option>
              {options
                .filter(
                  (option) =>
                    !chosen.some((skill) => skill.skill_id === option.id),
                )
                .map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
            </select>
            <button
              type="button"
              onClick={add}
              disabled={picking === ""}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <Plus size={15} /> Add
            </button>
          </div>

          {chosen.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No skills listed yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {chosen.map((skill) => (
                <li
                  key={skill.skill_id}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 px-3 py-2"
                >
                  <span className="flex-1 text-sm font-medium text-slate-800">
                    {skill.name}
                  </span>

                  <label className="sr-only" htmlFor={`prof-${skill.skill_id}`}>
                    Proficiency in {skill.name}
                  </label>
                  <select
                    id={`prof-${skill.skill_id}`}
                    value={skill.proficiency ?? ""}
                    onChange={(event) =>
                      setProficiency(skill.skill_id, event.target.value)
                    }
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs capitalize outline-none"
                  >
                    <option value="">Level…</option>
                    {PROFICIENCY.map((level) => (
                      <option key={level} value={level} className="capitalize">
                        {level}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => drop(skill.skill_id)}
                    aria-label={`Remove ${skill.name}`}
                    className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <X size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {error && (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Save skills
            </button>
            {saved && (
              <span className="text-sm text-emerald-700">Skills saved.</span>
            )}
          </div>
        </>
      )}
    </section>
  );
}
