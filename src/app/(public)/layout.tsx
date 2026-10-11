import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getProfile } from "@/lib/data";
import { t } from "@/lib/i18n/ja";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const profile = await getProfile();
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        {t.site.skipToContent}
      </a>
      <SiteHeader handle={profile.handle} githubUrl={profile.githubUrl} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter handle={profile.handle} githubUrl={profile.githubUrl} />
    </>
  );
}
