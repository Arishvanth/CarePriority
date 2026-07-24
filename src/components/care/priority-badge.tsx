import { priorityStyles, type Priority } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const s = priorityStyles[priority];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", s.badge, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}