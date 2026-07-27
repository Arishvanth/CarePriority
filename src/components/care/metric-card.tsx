import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type Tone = "primary" | "success" | "warning" | "danger" | "accent";

const toneClasses: Record<Tone, string> = {
  primary: "bg-primary-light text-primary-hover",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  accent: "bg-accent/15 text-accent-foreground",
};

interface MetricCardProps {
  label: string;
  value: string | number;
  hint?: string;
  delta?: number;
  icon: LucideIcon;
  tone?: Tone;
  loading?: boolean;
}

export function MetricCard({
  label,
  value,
  hint,
  delta,
  icon: Icon,
  tone = "primary",
  loading,
}: MetricCardProps) {
  return (
    <article className="panel panel-lift rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-2.5 h-8 w-16" />
          ) : (
            <p className="mt-1.5 font-display text-3xl font-semibold tabular-nums text-foreground">
              {value}
            </p>
          )}
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <span
          className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", toneClasses[tone])}
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {delta !== undefined && !loading && (
        <p className="mt-3 flex items-center gap-1.5 text-xs">
          {delta >= 0 ? (
            <TrendingUp className="h-3.5 w-3.5 text-success" aria-hidden="true" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-danger" aria-hidden="true" />
          )}
          <span className={delta >= 0 ? "font-medium text-success" : "font-medium text-danger"}>
            {delta >= 0 ? "+" : ""}
            {delta}%
          </span>
          <span className="text-muted-foreground">vs last week</span>
        </p>
      )}
    </article>
  );
}
