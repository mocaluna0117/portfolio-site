import Link from "next/link";
import { GithubIcon } from "@/components/site/github-icon";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n/ja";

export function SiteHeader({ handle, githubUrl }: { handle: string; githubUrl: string }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="text-base font-bold tracking-tight">
          {handle}
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/#works">{t.nav.works}</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/#contact">{t.nav.contact}</Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <a href={githubUrl} target="_blank" rel="noopener noreferrer" aria-label={t.nav.github}>
              <GithubIcon className="size-4" />
            </a>
          </Button>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
