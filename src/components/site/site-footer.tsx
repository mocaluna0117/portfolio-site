import { cacheLife } from "next/cache";
import { GithubIcon } from "@/components/site/github-icon";
import { t } from "@/lib/i18n/ja";

/** The year, cached so the footer stays part of every page's static shell. */
async function currentYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function SiteFooter({ handle, githubUrl }: { handle: string; githubUrl: string }) {
  const year = await currentYear();
  return (
    <footer className="mt-24 border-t">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6">
        <p>{t.footer.copyright(year, handle)}</p>
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
        >
          <GithubIcon className="size-4" />
          {githubUrl.replace(/^https:\/\//, "")}
        </a>
      </div>
    </footer>
  );
}
