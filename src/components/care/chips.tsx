import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { priorityMeta, statusMeta, type Priority, type PatientStatus } from "@/lib/triage";

export function Chip({
  children,
  className,
  dot,
}: {
  children: ReactNode;
  className?: string;
  dot?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        className,
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dot)} aria-hidden="true" />}
      {children}
    </span>
  );
}

export function PriorityChip({ priority, className }: { priority: Priority; className?: string }) {
  const meta = priorityMeta[priority];
  return (
    <Chip className={cn(meta.chip, className)} dot={meta.dot}>
      <span className="sr-only">Priority: </span>
      {meta.label}
    </Chip>
  );
}

export function StatusChip({ status, className }: { status: PatientStatus; className?: string }) {
  const meta = statusMeta[status];
  return <Chip className={cn(meta.chip, className)}>{meta.label}</Chip>;
}

export function AssessmentPendingChip({ className }: { className?: string }) {
  return (
    <Chip className={cn("border-warning/35 bg-warning-soft text-warning-foreground", className)} dot="bg-warning">
      Assessment Pending
    </Chip>
  );
}
