import Link from "next/link";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n/ja";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-2xl font-bold">{t.notFound.title}</h1>
      <p className="mt-3 text-muted-foreground">{t.notFound.body}</p>
      <Button className="mt-8" asChild>
        <Link href="/">{t.notFound.home}</Link>
      </Button>
    </main>
  );
}
