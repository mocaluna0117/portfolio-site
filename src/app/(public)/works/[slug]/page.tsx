import { ArrowLeft, ChevronDown, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MarkdownDoc } from "@/components/markdown/markdown-doc";
import { Skeleton } from "@/components/ui/skeleton";
import {
  HighlightsBox,
  LinksRow,
  TocList,
  VideoPlayer,
  WorkHeader,
} from "@/components/work/work-parts";
import { getPublishedSlugs, getWork } from "@/lib/data";
import { t } from "@/lib/i18n/ja";
import { extractToc, type TocItem } from "@/lib/markdown/toc";

/** Placeholder for a build with nothing published yet; it renders a 404. */
const PLACEHOLDER = "__placeholder__";

export async function generateStaticParams() {
  const slugs = await getPublishedSlugs();
  return slugs.length > 0 ? slugs.map(({ slug }) => ({ slug })) : [{ slug: PLACEHOLDER }];
}

export async function generateMetadata({ params }: PageProps<"/works/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const work = await getWork(slug);
  if (!work) return { title: t.notFound.title };
  const title = work.subtitle ? `${work.title} — ${work.subtitle}` : work.title;
  return {
    title,
    description: work.tagline,
    alternates: { canonical: `/works/${work.slug}` },
    openGraph: { type: "article", title, description: work.tagline },
  };
}

const formatDate = (time: number) =>
  new Intl.DateTimeFormat("ja-JP", { dateStyle: "long", timeZone: "Asia/Tokyo" }).format(time);

async function WorkContent({ params }: Pick<PageProps<"/works/[slug]">, "params">) {
  const { slug } = await params;
  const work = await getWork(slug);
  if (!work) notFound();

  const docToc = work.doc ? extractToc(work.doc.markdown) : [];
  const toc: TocItem[] = [
    ...(work.highlights.length > 0
      ? [{ depth: 2 as const, text: t.work.highlights, id: "highlights" }]
      : []),
    ...(work.video ? [{ depth: 2 as const, text: t.work.video, id: "demo" }] : []),
    ...docToc,
  ];

  return (
    <>
      <WorkHeader work={work} />
      <LinksRow work={work} />

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="grid min-w-0 grid-cols-1 gap-12">
          <HighlightsBox highlights={work.highlights} />
          {work.video ? <VideoPlayer video={work.video} poster={work.thumbnail?.url} /> : null}

          <section aria-label={t.work.doc}>
            {toc.length > 0 ? (
              <details className="group mb-8 rounded-xl border p-4 lg:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold">
                  {t.work.toc}
                  <ChevronDown
                    className="size-4 transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <TocList items={toc} className="mt-3" />
              </details>
            ) : null}

            {work.doc ? (
              <>
                <MarkdownDoc markdown={work.doc.markdown} images={work.images} />
                <p className="mt-12 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-6 text-sm text-muted-foreground">
                  <span>{t.work.importedAt(formatDate(work.doc.importedAt))}</span>
                  <a
                    href={work.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 underline underline-offset-4 hover:text-foreground"
                  >
                    {t.work.viewSource}
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">{t.work.noDoc}</p>
            )}
          </section>
        </div>

        {toc.length > 0 ? (
          <aside className="hidden lg:block">
            <nav
              aria-label={t.work.toc}
              className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-8"
            >
              <p className="mb-3 text-sm font-bold">{t.work.toc}</p>
              <TocList items={toc} />
            </nav>
          </aside>
        ) : null}
      </div>
    </>
  );
}

function WorkSkeleton() {
  return (
    <div className="max-w-3xl" aria-hidden>
      <Skeleton className="h-5 w-20" />
      <Skeleton className="mt-4 h-10 w-2/3" />
      <Skeleton className="mt-3 h-6 w-1/2" />
      <Skeleton className="mt-6 h-20 w-full" />
      <Skeleton className="mt-12 aspect-video w-full" />
    </div>
  );
}

export default function WorkPage(props: PageProps<"/works/[slug]">) {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-8 pb-8 sm:px-6 sm:pt-10">
      <Link
        href="/#works"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t.work.back}
      </Link>
      <div className="mt-6">
        <Suspense fallback={<WorkSkeleton />}>
          <WorkContent params={props.params} />
        </Suspense>
      </div>
    </div>
  );
}
