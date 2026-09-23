import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Clock, Eye } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { DarkFooter } from "@/components/Shared";
import Comments from "@/components/articles/Comments";
import { fetchPublic, ServerFetchError } from "@/lib/api/server";
import JsonLd from "@/lib/seo/JsonLd";
import { articleSchema, breadcrumbSchema } from "@/lib/seo/schemas";
import { articleThumbnail } from "@/lib/thumbnails";
import type { PublicArticle } from "@/lib/api/types";

interface Props {
  params: Promise<{ slug: string }>;
}

async function loadArticle(slug: string): Promise<PublicArticle | null> {
  try {
    const { data } = await fetchPublic<{ data: PublicArticle }>(
      `/articles/${slug}`,
    );
    return data;
  } catch (error) {
    // A missing or unpublished article is a 404, not a crash — the status
    // travels on the error precisely so this can tell them apart.
    if (error instanceof ServerFetchError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await loadArticle(slug);

  if (!article) return { title: "Article not found" };

  const title = article.meta_title ?? `${article.title}`;
  const description = article.meta_description ?? article.excerpt ?? undefined;

  return {
    title,
    description,
    alternates: { canonical: `/articles/${article.slug}` },
    // "article" rather than the default, so shares carry the byline and date.
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: article.published_at ?? undefined,
      authors: article.author ? [article.author.name] : undefined,
    },
  };
}

function formatDate(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;

  const article = await loadArticle(slug);
  if (!article) notFound();

  const related = await fetchPublic<{ data: PublicArticle[] }>(
    `/articles/${slug}/related`,
  ).catch(() => ({ data: [] as PublicArticle[] }));

  return (
    <>
      <JsonLd data={articleSchema(article)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Articles", path: "/articles" },
          { name: article.title, path: `/articles/${article.slug}` },
        ])}
      />

      <SiteHeader active="Articles" />

      <main className="flex-1 bg-white">
        <article className="mx-auto max-w-3xl px-6 py-10">
          <Link
            href="/articles"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            All articles
          </Link>

          {article.category && (
            <Link
              href={`/articles?category=${article.category.slug}`}
              className="inline-block rounded bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            >
              {article.category.name}
            </Link>
          )}

          <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="mt-3 text-lg text-slate-500">{article.excerpt}</p>
          )}

          {/*
            The lead image, between the headline and the byline where a
            reader expects it. Uses the article's own featured image when
            one has been uploaded, and a category photo otherwise — the
            column has always existed and been served by the API, but no
            page had ever rendered it.
          */}
          <figure className="mt-6 overflow-hidden rounded-2xl bg-slate-100">
            <img
              src={articleThumbnail(
                article.featured_image_path,
                article.category?.slug ?? null,
                article.slug,
              )}
              // Empty on purpose: the image is decorative, and the API does
              // not serve the alt text the column stores.
              alt=""
              className="aspect-[16/9] w-full object-cover"
            />
          </figure>

          <div className="mt-5 flex flex-wrap items-center gap-4 border-y border-slate-100 py-3 text-sm text-slate-400">
            {article.author && (
              <span className="font-medium text-slate-600">
                {article.author.name}
              </span>
            )}
            <span>{formatDate(article.published_at)}</span>
            {article.reading_minutes && (
              <span className="inline-flex items-center gap-1">
                <Clock size={13} /> {article.reading_minutes} min read
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Eye size={13} /> {article.views_count.toLocaleString()} views
            </span>
            {article.is_sponsored && (
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                Sponsored
              </span>
            )}
          </div>

          {/*
            The body is seeded and authored as plain text with blank-line
            paragraphs. It is split and rendered as text rather than injected
            as HTML — dangerouslySetInnerHTML here would make every author a
            potential XSS vector on a page every visitor reads.
          */}
          <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-slate-700">
            {(article.body ?? "")
              .split(/\n\s*\n/)
              .filter((paragraph) => paragraph.trim() !== "")
              .map((paragraph, index) => (
                <p key={index}>{paragraph.trim()}</p>
              ))}
          </div>

          {/*
            The discussion, below the piece it is about. Client-rendered: it
            changes as readers post, while the article above it is cached.
          */}
          <Comments slug={article.slug} />
        </article>

        {related.data.length > 0 && (
          <section className="border-t border-slate-100 bg-slate-50">
            <div className="mx-auto max-w-5xl px-6 py-10">
              <h2 className="mb-5 text-lg font-bold text-slate-900">
                Related reading
              </h2>
              <div className="grid gap-5 sm:grid-cols-3">
                {related.data.map((a) => (
                  <Link
                    key={a.id}
                    href={`/articles/${a.slug}`}
                    className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                      <img
                        src={articleThumbnail(
                          a.featured_image_path,
                          a.category?.slug ?? null,
                          a.slug,
                        )}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    <div className="p-4">
                      {a.category && (
                        <span className="text-xs font-semibold text-blue-600">
                          {a.category.name}
                        </span>
                      )}
                      <h3 className="mt-1 font-semibold leading-snug text-slate-900">
                        {a.title}
                      </h3>
                      <p className="mt-2 text-xs text-slate-400">
                        {formatDate(a.published_at)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <DarkFooter />
    </>
  );
}
