import { ExternalLink, PlayCircle } from "lucide-react";
import { StatusBadge } from "@/components/site/status-badge";
import { TagList } from "@/components/site/tag-list";
import { Button } from "@/components/ui/button";
import type { Work } from "@/lib/data";
import { t } from "@/lib/i18n/ja";
import type { TocItem } from "@/lib/markdown/toc";
import { cn } from "@/lib/utils";

export function WorkHeader({ work }: { work: Work }) {
  return (
    <header className="max-w-3xl">
      <StatusBadge status={work.status} />
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{work.title}</h1>
      {work.subtitle ? <p className="mt-2 text-lg text-muted-foreground">{work.subtitle}</p> : null}
      {work.tagline ? <p className="mt-5 leading-relaxed">{work.tagline}</p> : null}
      <TagList tags={work.tags} label={t.work.tags} className="mt-5" />
    </header>
  );
}

export function LinksRow({ work }: { work: Work }) {
  if (work.links.length === 0 && !work.video) return null;
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {work.video ? (
        <Button asChild>
          <a href="#demo">
            <PlayCircle aria-hidden />
            {t.work.watchVideo}
          </a>
        </Button>
      ) : null}
      {work.links.map((link) => (
        <Button key={link.url} variant="outline" asChild>
          <a href={link.url} target="_blank" rel="noopener noreferrer">
            {link.label}
            <ExternalLink aria-hidden />
          </a>
        </Button>
      ))}
    </div>
  );
}

export function HighlightsBox({ highlights }: { highlights: string[] }) {
  if (highlights.length === 0) return null;
  return (
    <section aria-labelledby="highlights" className="rounded-xl border bg-accent/50 p-5 sm:p-6">
      <h2 id="highlights" className="text-base font-bold">
        {t.work.highlights}
      </h2>
      <ol className="mt-3 grid gap-2.5">
        {highlights.map((highlight, index) => (
          <li key={highlight} className="flex gap-3 text-sm leading-relaxed sm:text-[0.9375rem]">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {index + 1}
            </span>
            <span>{highlight}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function VideoPlayer({
  video,
  poster,
}: {
  video: NonNullable<Work["video"]>;
  poster?: string;
}) {
  return (
    <section id="demo" aria-labelledby="demo-title">
      <h2 id="demo-title" className="mb-3 text-base font-bold">
        {t.work.video}
      </h2>
      <video
        controls
        preload="metadata"
        playsInline
        poster={poster}
        className="max-h-[80vh] w-full rounded-xl border bg-black"
      >
        <source src={video.url} type={video.mime} />
        {t.work.videoUnsupported}
      </video>
    </section>
  );
}

export function TocList({ items, className }: { items: TocItem[]; className?: string }) {
  return (
    <ol className={cn("grid gap-1 text-sm", className)}>
      {items.map((item) => (
        <li key={item.id} className={item.depth === 3 ? "pl-3" : undefined}>
          <a
            href={`#${item.id}`}
            className={cn(
              "block rounded py-0.5 leading-snug transition-colors hover:text-foreground",
              item.depth === 2 ? "font-medium text-foreground/80" : "text-muted-foreground",
            )}
          >
            {item.text}
          </a>
        </li>
      ))}
    </ol>
  );
}
