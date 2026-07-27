import { AlertTriangle, BellOff, CheckCheck, Info, Siren } from "lucide-react";
import type { Alert } from "@/data/types";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./empty-state";

const severityMeta: Record<string, { icon: typeof Info; wrap: string; label: string }> = {
  critical: { icon: Siren, wrap: "bg-danger-soft text-danger", label: "Critical" },
  warning: { icon: AlertTriangle, wrap: "bg-warning-soft text-warning", label: "Warning" },
  info: { icon: Info, wrap: "bg-primary-light text-primary-hover", label: "Info" },
};

export function AlertFeed({
  alerts,
  onAcknowledge,
  emptyHint,
}: {
  alerts: Alert[];
  onAcknowledge?: (alert: Alert) => void;
  emptyHint?: string;
}) {
  if (alerts.length === 0) {
    return (
      <EmptyState
        icon={BellOff}
        title="Nothing needs your attention"
        description={emptyHint ?? "Emergency and overflow alerts will appear here the moment they are raised."}
      />
    );
  }

  return (
    <ul className="divide-y divide-border">
      {alerts.map((alert) => {
        const meta = severityMeta[alert.severity] ?? severityMeta.info;
        const Icon = meta.icon;
        const done = Boolean(alert.acknowledged_at);
        return (
          <li key={alert.id} className={cn("flex items-start gap-3 px-5 py-4", done && "opacity-55")}>
            <span
              className={cn(
                "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                meta.wrap,
                alert.severity === "critical" && !done && "animate-ping-ring",
              )}
              aria-hidden="true"
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p className="text-sm font-medium text-foreground">{alert.title}</p>
                <span className="text-xs text-muted-foreground">{relativeTime(alert.created_at)}</span>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{alert.message}</p>
              {alert.audience && (
                <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  For {alert.audience}s
                </p>
              )}
            </div>
            {onAcknowledge && !done && (
              <Button size="sm" variant="ghost" onClick={() => onAcknowledge(alert)}>
                <CheckCheck className="h-3.5 w-3.5" /> Acknowledge
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
