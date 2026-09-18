import type { ReactNode } from "react";
import SiteHeader from "@/components/SiteHeader";
import { DarkFooter } from "@/components/Shared";

/**
 * Shared chrome for the legal pages.
 *
 * Both documents want the same narrow measure and heading rhythm, and a
 * "last updated" line readers look for before anything else.
 */
export default function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  /** The date the document last changed, in prose. */
  updated: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader />

      <main className="flex-1 bg-white">
        <div className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-3xl px-6 py-10">
            <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
            <p className="mt-2 text-sm text-slate-500">Last updated: {updated}</p>
            <p className="mt-4 text-slate-600">{intro}</p>
          </div>
        </div>

        <article
          className="mx-auto max-w-3xl space-y-8 px-6 py-10
            [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900
            [&_h3]:mt-4 [&_h3]:font-semibold [&_h3]:text-slate-800
            [&_p]:mt-2 [&_p]:text-[15px] [&_p]:leading-relaxed [&_p]:text-slate-600
            [&_li]:mt-1.5 [&_li]:text-[15px] [&_li]:leading-relaxed [&_li]:text-slate-600
            [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5"
        >
          {children}
        </article>
      </main>

      <DarkFooter />
    </>
  );
}
