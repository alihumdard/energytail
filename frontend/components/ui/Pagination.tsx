import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  currentPage: number;
  lastPage: number;
  /** Builds the href for a page, keeping whatever filters are active. */
  hrefFor: (page: number) => string;
  /** Describes the list being paged, for screen readers. */
  label?: string;
  /**
   * Whether the list has any results at all.
   *
   * The API reports last_page as 1 for an empty result, so the page count
   * alone cannot tell "one page of results" from "nothing matched" — and a
   * lone "1" above an empty-state message reads as a broken control.
   */
  hasResults?: boolean;
}

/**
 * Page numbers for a paginated list.
 *
 * "Previous / Page 2 of 9 / Next" told a reader where they were but gave
 * them one step in each direction, so reaching the end of a long board meant
 * clicking Next until it stopped. Numbers make any page one click away.
 *
 * The window is deliberately narrow — first, last, the current page and one
 * either side, with gaps elided — so the control stays a single row on a
 * phone no matter how many pages there are.
 */
function pageWindow(current: number, last: number): (number | "gap")[] {
  // Up to seven pages fit without eliding anything.
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);

  const pages = new Set<number>([1, last, current]);

  if (current - 1 > 1) pages.add(current - 1);
  if (current + 1 < last) pages.add(current + 1);

  // Keep the row a stable width near the ends, where the window would
  // otherwise collapse against the first or last page.
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= last - 2) {
    pages.add(last - 1);
    pages.add(last - 2);
    pages.add(last - 3);
  }

  const sorted = [...pages].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b);
  const withGaps: (number | "gap")[] = [];

  for (const [index, page] of sorted.entries()) {
    // A single skipped page is shown rather than elided — "… 5 …" costs the
    // same width as the number it hides.
    if (index > 0 && page - sorted[index - 1] > 1) withGaps.push("gap");

    withGaps.push(page);
  }

  return withGaps;
}

export default function Pagination({
  currentPage,
  lastPage,
  hrefFor,
  label = "Pagination",
  hasResults = true,
}: Props) {
  /*
   * A single page still renders, as "1" with both arrows disabled.
   *
   * Hiding the control entirely left a list that fits on one page looking
   * like a list whose paging had gone missing. Showing it says the results
   * end here — and the arrows being visibly unavailable is the difference
   * between "nothing more" and "nothing loaded".
   */
  if (!hasResults || lastPage < 1) return null;

  const pages = pageWindow(currentPage, lastPage);

  const arrow =
    "flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50";

  return (
    <nav
      aria-label={label}
      className="mt-8 flex flex-wrap items-center justify-center gap-1.5"
    >
      {currentPage > 1 ? (
        <Link href={hrefFor(currentPage - 1)} rel="prev" className={arrow}>
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </Link>
      ) : (
        // A real disabled button, kept in the layout so the numbers do not
        // shift sideways at the first page. Not aria-hidden: a reader
        // should be told the control exists and is unavailable, rather
        // than finding no previous control at all.
        <button
          type="button"
          disabled
          className={`${arrow} cursor-not-allowed opacity-40 hover:border-slate-200 hover:bg-white`}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>
      )}

      {pages.map((page, index) =>
        page === "gap" ? (
          <span
            key={`gap-${index}`}
            aria-hidden="true"
            className="px-1 text-sm text-slate-400"
          >
            …
          </span>
        ) : page === currentPage ? (
          <span
            key={page}
            aria-current="page"
            className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white"
          >
            {page}
          </span>
        ) : (
          <Link
            key={page}
            href={hrefFor(page)}
            aria-label={`Page ${page}`}
            className="flex h-9 min-w-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            {page}
          </Link>
        ),
      )}

      {currentPage < lastPage ? (
        <Link href={hrefFor(currentPage + 1)} rel="next" className={arrow}>
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className={`${arrow} cursor-not-allowed opacity-40 hover:border-slate-200 hover:bg-white`}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </nav>
  );
}
