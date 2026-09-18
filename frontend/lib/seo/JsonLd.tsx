import type { Thing, WithContext } from "schema-dts";

/**
 * Emits a JSON-LD block for crawlers.
 *
 * The payload is typed against schema.org rather than being a free-form
 * object: structured data that does not match the vocabulary is silently
 * ignored by search engines, which is the worst kind of failure — the page
 * looks fine and the rich result never appears.
 */
export default function JsonLd<T extends Thing>({ data }: { data: WithContext<T> }) {
  /*
   * The values here are employer- and author-supplied free text. Inside a
   * <script> tag the browser looks for the closing "</script>" before any
   * JSON parsing happens, so a description containing one would end this
   * element early and leave the rest of the field to be parsed as markup —
   * stored XSS on a page every visitor and crawler loads.
   *
   * Replacing "<" with its < escape keeps the JSON semantically
   * identical (a JSON parser resolves the escape back) while making the
   * byte sequence "</script>" impossible to write.
   *
   * The escape must reach the output as a backslash followed by u003c, so
   * the replacement is written "\\u003c": a single backslash here would be
   * a TypeScript escape that the compiler resolves to "<" before it ever
   * runs, silently turning this into a no-op.
   */
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
