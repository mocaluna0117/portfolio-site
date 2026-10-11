import { cn } from "@/lib/utils";

export function TagList({
  tags,
  label,
  className,
}: {
  tags: string[];
  label: string;
  className?: string;
}) {
  if (tags.length === 0) return null;
  return (
    <ul aria-label={label} className={cn("flex flex-wrap gap-1.5", className)}>
      {tags.map((tag) => (
        <li
          key={tag}
          className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground"
        >
          {tag}
        </li>
      ))}
    </ul>
  );
}
