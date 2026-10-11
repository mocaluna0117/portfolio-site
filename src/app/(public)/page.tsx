import { ArrowDown } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";
import { GithubIcon } from "@/components/site/github-icon";
import { WorkCard } from "@/components/site/work-card";
import { Button } from "@/components/ui/button";
import { getProfile, getWorks } from "@/lib/data";
import { t } from "@/lib/i18n/ja";

export default async function HomePage() {
  const [profile, works] = await Promise.all([getProfile(), getWorks()]);
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-14 sm:px-6 sm:pt-24 sm:pb-20">
        <p className="text-sm font-semibold tracking-wide text-primary">作品集</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{profile.handle}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          {profile.intro}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <a href="#works">
              {t.home.viewWorks}
              <ArrowDown aria-hidden />
            </a>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer">
              <GithubIcon className="size-4" />
              {t.nav.github}
            </a>
          </Button>
        </div>
      </section>

      <section id="works" aria-labelledby="works-title" className="border-y bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <h2 id="works-title" className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t.home.worksTitle}
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">{t.home.worksLead}</p>
          {works.length === 0 ? (
            <p className="mt-10 text-muted-foreground">{t.home.noWorks}</p>
          ) : (
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {works.map((work, index) => (
                <WorkCard key={work.slug} work={work} priority={index < 2} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section
        id="contact"
        aria-labelledby="contact-title"
        className="mx-auto max-w-3xl px-4 pt-16 sm:px-6 sm:pt-20"
      >
        <h2 id="contact-title" className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t.contact.title}
        </h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">{t.contact.lead}</p>
        <div className="mt-8">
          <ContactForm />
        </div>
      </section>
    </>
  );
}
