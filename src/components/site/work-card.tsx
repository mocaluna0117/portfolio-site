import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { StatusBadge } from "@/components/site/status-badge";
import { TagList } from "@/components/site/tag-list";
import type { WorkCard as WorkCardData } from "@/lib/data";
import { t } from "@/lib/i18n/ja";

export function WorkCard({ work, priority }: { work: WorkCardData; priority?: boolean }) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-lg">
      <div className="relative aspect-[16/10] overflow-hidden border-b bg-muted">
        {work.thumbnail ? (
          <Image
            src={work.thumbnail.url}
            alt=""
            fill
            sizes="(min-width: 1024px) 560px, (min-width: 768px) 50vw, 100vw"
            className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
            priority={priority}
          />
        ) : null}
        <StatusBadge status={work.status} className="absolute top-3 left-3 shadow-sm" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="text-lg leading-snug font-bold">
            {/* The whole card is the link; this keeps one accessible name. */}
            <Link href={`/works/${work.slug}`} prefetch className="after:absolute after:inset-0">
              {work.title}
            </Link>
          </h3>
          {work.subtitle ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{work.subtitle}</p>
          ) : null}
        </div>
        <p className="text-sm leading-relaxed">{work.tagline}</p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-1">
          <TagList tags={work.tags} label={t.work.tags} />
          <ArrowRight
            className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
            aria-hidden
          />
        </div>
      </div>
    </article>
  );
}
