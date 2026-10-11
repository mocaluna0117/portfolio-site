import type { WorkStatus } from "@convex/lib/validators";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n/ja";
import { cn } from "@/lib/utils";

/**
 * In use by others today (実運用中・公開中) is what a reader most wants to
 * know, so only those two carry the accent.
 */
const STYLE: Record<WorkStatus, string> = {
  production: "bg-primary text-primary-foreground border-transparent",
  public: "bg-primary text-primary-foreground border-transparent",
  distributed: "bg-accent text-accent-foreground border-transparent",
  personal: "bg-secondary text-secondary-foreground border-transparent",
  archived: "text-muted-foreground",
};

export function StatusBadge({ status, className }: { status: WorkStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", STYLE[status], className)}>
      {t.status[status]}
    </Badge>
  );
}
