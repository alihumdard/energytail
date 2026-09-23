import ReactMarkdown from "react-markdown";

/**
 * An article body, rendered from Markdown.
 *
 * react-markdown builds React elements directly and never parses an HTML
 * string, so there is no dangerouslySetInnerHTML anywhere in this path —
 * raw HTML written into an article renders as the characters an author
 * typed, not as markup. That is the whole reason the body is Markdown
 * rather than the HTML a WYSIWYG editor would produce: this page is read
 * by every visitor, and an author should not be able to run script in
 * their browsers.
 *
 * Styles are set per element rather than through a typography plugin the
 * project does not have, and match the prose the page used when the body
 * was plain paragraphs.
 */
export default function ArticleBody({ body }: { body: string }) {
  return (
    <div className="space-y-4 text-base leading-[1.75] text-slate-700">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p>{children}</p>,
          h1: ({ children }) => (
            <h2 className="mt-8 text-2xl font-bold text-slate-900">{children}</h2>
          ),
          h2: ({ children }) => (
            <h2 className="mt-8 text-xl font-bold text-slate-900">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-6 text-lg font-bold text-slate-900">{children}</h3>
          ),
          ul: ({ children }) => (
            <ul className="list-disc space-y-1.5 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1.5 pl-5">{children}</ol>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-slate-200 pl-4 italic text-slate-500">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[13px] text-slate-800">
              {children}
            </code>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-900">{children}</strong>
          ),
          /*
           * Every link opens in a new tab with rel="noopener noreferrer".
           * These URLs come from article text, so the target document must
           * not be handed a window.opener back into this page.
           */
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="border-slate-200" />,
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
