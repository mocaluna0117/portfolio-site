"use client";

import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/errors";

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid justify-items-start gap-4">
      <h1 className="text-xl font-bold">表示できませんでした</h1>
      <p className="text-sm text-muted-foreground">{errorMessage(error)}</p>
      <Button variant="outline" onClick={reset}>
        もう一度読み込む
      </Button>
    </div>
  );
}
