"use client";

import { useRef, useState } from "react";
import {
  Bold,
  Code,
  Eye,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  PenLine,
  Quote,
} from "lucide-react";
import ArticleBody from "@/components/articles/ArticleBody";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  invalid?: boolean;
  id?: string;
}

/**
 * A writing surface with a formatting toolbar, storing Markdown.
 *
 * Deliberately not a WYSIWYG editor. Those produce raw HTML, and the
 * article body is read by every visitor — rendering author-supplied HTML
 * would make each author an XSS vector, which is why the detail page has
 * always rendered the body as plain text.
 *
 * Markdown keeps the toolbar an author wants while the stored value stays
 * inert text: it only becomes formatting when react-markdown turns it into
 * React elements, and that path builds nodes directly rather than parsing
 * an HTML string, so a <script> written into the body renders as the
 * characters "<script>".
 */

interface ToolbarAction {
  label: string;
  icon: typeof Bold;
  /** Wrapped around the selection, or inserted at the caret. */
  before: string;
  after?: string;
  /** Placeholder used when nothing is selected. */
  sample: string;
  /** Whether the action applies to whole lines rather than a selection. */
  block?: boolean;
}

const ACTIONS: ToolbarAction[] = [
  { label: "Bold", icon: Bold, before: "**", after: "**", sample: "bold text" },
  { label: "Italic", icon: Italic, before: "_", after: "_", sample: "italic text" },
  { label: "Heading", icon: Heading2, before: "## ", sample: "Heading", block: true },
  { label: "Quote", icon: Quote, before: "> ", sample: "Quoted line", block: true },
  { label: "Bulleted list", icon: List, before: "- ", sample: "List item", block: true },
  {
    label: "Numbered list",
    icon: ListOrdered,
    before: "1. ",
    sample: "List item",
    block: true,
  },
  { label: "Link", icon: Link2, before: "[", after: "](https://)", sample: "link text" },
  { label: "Code", icon: Code, before: "`", after: "`", sample: "code" },
];

export default function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 16,
  invalid = false,
  id,
}: Props) {
  const [preview, setPreview] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Applies an action around the current selection.
   *
   * The caret is restored afterwards, and left around the inserted sample
   * when there was no selection — so the placeholder can be typed over
   * rather than hunted for.
   */
  function apply(action: ToolbarAction) {
    const area = areaRef.current;
    if (!area) return;

    const { selectionStart: start, selectionEnd: end } = area;
    const selected = value.slice(start, end);
    const text = selected || action.sample;

    let inserted: string;
    /** Characters added before the text, which the caret has to skip past. */
    let lead: string;

    if (action.block) {
      /*
       * A block marker only counts at the start of a line: "text ## Heading"
       * is the literal characters, not a heading. So anything already on the
       * line is closed off first, and a blank line is left after it — two
       * newlines, because a heading or list glued to the paragraph above it
       * is parsed as part of that paragraph.
       */
      const before = value.slice(0, start);
      const atLineStart = before === "" || before.endsWith("\n");
      const afterBlankLine = before === "" || before.endsWith("\n\n");

      const prefix = atLineStart ? (afterBlankLine ? "" : "\n") : "\n\n";

      // Each line is prefixed, so marking three lines as a list makes three
      // list items rather than one.
      const body = text
        .split("\n")
        .map((line) => `${action.before}${line}`)
        .join("\n");

      // A trailing blank line keeps whatever follows out of the block.
      const rest = value.slice(end);
      const suffix = rest === "" || rest.startsWith("\n") ? "" : "\n\n";

      lead = prefix + action.before;
      inserted = prefix + body + suffix;
    } else {
      lead = action.before;
      inserted = `${action.before}${text}${action.after ?? ""}`;
    }

    onChange(value.slice(0, start) + inserted + value.slice(end));

    // After React has written the new value, put the caret over the sample
    // so typing replaces it.
    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(start + lead.length, start + lead.length + text.length);
    });
  }

  return (
    <div
      className={`overflow-hidden rounded-lg border transition-colors ${
        invalid ? "border-red-300" : "border-slate-200 focus-within:border-blue-400"
      }`}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-100 bg-slate-50 px-2 py-1.5">
        {ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            title={action.label}
            aria-label={action.label}
            disabled={preview}
            onClick={() => apply(action)}
            className="grid h-8 w-8 place-items-center rounded-md text-slate-500 transition-colors hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <action.icon className="h-4 w-4" />
          </button>
        ))}

        {/* Writing and reading are different tasks, so they are different
            views rather than a split pane that halves both. */}
        <button
          type="button"
          onClick={() => setPreview((v) => !v)}
          className="ml-auto flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-white hover:text-slate-900"
        >
          {preview ? (
            <>
              <PenLine className="h-3.5 w-3.5" /> Write
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" /> Preview
            </>
          )}
        </button>
      </div>

      {preview ? (
        <div className="min-h-[20rem] bg-white px-3.5 py-3">
          {value.trim() === "" ? (
            <p className="text-sm text-slate-400">Nothing to preview yet.</p>
          ) : (
            <ArticleBody body={value} />
          )}
        </div>
      ) : (
        <textarea
          id={id}
          ref={areaRef}
          rows={rows}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="block w-full resize-y bg-white px-3.5 py-3 font-mono text-[13.5px] leading-relaxed text-slate-700 outline-none placeholder:font-sans placeholder:text-slate-400"
        />
      )}

      <p className="border-t border-slate-100 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-400">
        Markdown supported — **bold**, _italic_, ## headings, - lists,
        [links](https://example.com).
      </p>
    </div>
  );
}
