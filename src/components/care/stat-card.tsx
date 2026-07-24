import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

interface Props {
  label: string;
  value: string;
  delta?: number;
  icon: LucideIcon;
  accent?: "primary" | "success" | "warning";
}

export function StatCard({ label, value, delta, icon: Icon, accent = "primary" }: Props) {
  const accentBg = { primary: "bg-primary/10 text-primary", success: "bg-success/10 text-success", warning: "bg-warning/10 text-warning" }[accent];
  return (
    <div className="glass group relative overflow-hidden rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-white/15">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", accentBg)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {delta !== undefined && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {delta >= 0 ? <TrendingUp className="h-3.5 w-3.5 text-success" /> : <TrendingDown className="h-3.5 w-3.5 text-danger" />}
          <span className={delta >= 0 ? "text-success" : "text-danger"}>{delta >= 0 ? "+" : ""}{delta}%</span>
          <span className="text-muted-foreground">vs last week</span>
        </div>
      )}
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/5 blur-3xl transition group-hover:bg-primary/10" />
    </div>
  );
}