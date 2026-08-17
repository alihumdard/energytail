"use client";

import { useMemo, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { Loader2, Save, Upload } from "lucide-react";
import { adminSettings } from "@/lib/api/endpoints";
import { useApiResource } from "@/lib/hooks/useApiResource";
import type { SettingItem } from "@/lib/api/types";

/** Human labels for the tab strip; groups not listed fall back to the key. */
const GROUP_LABELS: Record<string, string> = {
  general: "General",
  site: "Site",
  users: "Users & Registration",
  security: "Security",
  seo: "SEO",
  jobs: "Jobs",
  articles: "Articles",
  storage: "Storage",
  email: "Email",
  social: "Social Media",
  contact: "Contact",
};

function humanise(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SettingsPage() {
  const { data: response, loading, error, refetch } = useApiResource(
    () => adminSettings.list(),
    [],
  );

  const groups = useMemo(() => response?.data ?? {}, [response]);
  const groupKeys = useMemo(() => Object.keys(groups), [groups]);

  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  /** Pending edits, keyed by setting key. Only these are sent on save. */
  const [edits, setEdits] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  // Falls back to the first group until one is picked, rather than syncing a
  // default into state from an effect.
  const activeGroup = selectedGroup ?? groupKeys[0] ?? "";

  const items: SettingItem[] = groups[activeGroup] ?? [];

  function valueOf(item: SettingItem): unknown {
    return item.key in edits ? edits[item.key] : item.value;
  }

  function setValue(key: string, value: unknown) {
    setEdits((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function save() {
    const changed = Object.entries(edits).map(([key, value]) => ({ key, value }));

    if (changed.length === 0) return;

    setSaving(true);
    setSaveError(null);

    try {
      await adminSettings.save(changed);
      setEdits({});
      setSaved(true);
      refetch();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  async function upload(key: string, file: File) {
    setUploading(key);
    setSaveError(null);

    try {
      await adminSettings.uploadFile(key, file);
      refetch();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not upload the file.");
    } finally {
      setUploading(null);
    }
  }

  const dirtyCount = Object.keys(edits).length;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar active="settings" />

      <div className="flex-1 min-w-0 flex flex-col">
        <AdminTopbar variant="dark" showThemeToggle />

        <main className="flex-1 p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
              <p className="text-sm text-slate-500 mt-1">
                <span className="text-slate-400">Dashboard</span> &gt; Settings
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {saved && <span className="text-sm font-medium text-emerald-600">Saved</span>}
              {dirtyCount > 0 && (
                <span className="text-sm text-amber-600">
                  {dirtyCount} unsaved change{dirtyCount === 1 ? "" : "s"}
                </span>
              )}
              <button
                onClick={save}
                disabled={saving || dirtyCount === 0}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-2.5 text-sm"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </button>
            </div>
          </div>

          {saveError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {saveError}
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400">
              Loading settings…
            </div>
          )}

          {error && (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
              <p className="text-sm text-red-600">{error.message}</p>
              <button
                onClick={() => refetch()}
                className="mt-2 text-sm font-medium text-blue-600 hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">
              {/* Group tabs */}
              <nav className="bg-white rounded-2xl border border-slate-100 p-2">
                {groupKeys.map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGroup(g)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      activeGroup === g
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {GROUP_LABELS[g] ?? humanise(g)}
                  </button>
                ))}
              </nav>

              {/* Fields */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-5">
                <h2 className="font-semibold text-slate-900">
                  {GROUP_LABELS[activeGroup] ?? humanise(activeGroup)}
                </h2>

                {items.length === 0 && (
                  <p className="text-sm text-slate-400">No settings in this group.</p>
                )}

                {items.map((item) => {
                  const value = valueOf(item);

                  return (
                    <div key={item.key} className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-3 items-start">
                      <div>
                        <label
                          htmlFor={item.key}
                          className="text-sm font-medium text-slate-700"
                        >
                          {humanise(item.key)}
                        </label>
                        {item.description && (
                          <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                        )}
                      </div>

                      {item.type === "boolean" && (
                        <button
                          type="button"
                          onClick={() => setValue(item.key, !value)}
                          aria-pressed={Boolean(value)}
                          className={`w-11 h-6 rounded-full relative transition-colors ${
                            value ? "bg-blue-600" : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                              value ? "left-[22px]" : "left-0.5"
                            }`}
                          />
                        </button>
                      )}

                      {item.type === "file" && (
                        <div className="flex items-center gap-3">
                          {typeof value === "string" && value && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={value}
                              alt={humanise(item.key)}
                              className="h-10 w-auto rounded border border-slate-200 bg-slate-50"
                            />
                          )}
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg px-3.5 py-2 hover:bg-slate-50 cursor-pointer">
                            {uploading === item.key ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                            Upload
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) upload(item.key, file);
                              }}
                            />
                          </label>
                        </div>
                      )}

                      {item.type === "integer" && (
                        <input
                          id={item.key}
                          type="number"
                          value={String(value ?? "")}
                          onChange={(e) => setValue(item.key, Number(e.target.value))}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      )}

                      {item.type === "json" && (
                        <textarea
                          id={item.key}
                          rows={2}
                          value={typeof value === "string" ? value : JSON.stringify(value ?? [])}
                          onChange={(e) => setValue(item.key, e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      )}

                      {!["boolean", "file", "integer", "json"].includes(item.type) && (
                        <input
                          id={item.key}
                          type="text"
                          value={String(value ?? "")}
                          onChange={(e) => setValue(item.key, e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
