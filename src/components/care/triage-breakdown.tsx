import { Activity, HeartPulse, Stethoscope, UserRound, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { priorityMeta, PRIORITY_THRESHOLDS, type Priority, type TriageFactor } from "@/lib/triage";
import { EmptyState } from "./empty-state";

const kindIcon = {
  symptom: Stethoscope,
  vital: HeartPulse,
  demographic: UserRound,
  override: ShieldAlert,
} as const;

const kindLabel = {
  symptom: "Symptom",
  vital: "Vital sign",
  demographic: "Demographic",
  override: "Manual override",
} as const;

interface Props {
  score: number;
  priority: Priority;
  factors: TriageFactor[];
  className?: string;
}

/**
 * Explains *why* a patient received their priority. Every contributing factor
 * is listed with the number of points it added to the triage score.
 */
export function TriageBreakdown({ score, priority, factors, className }: Props) {
  const meta = priorityMeta[priority];
  const contributing = factors.filter((f) => f.weight > 0);
  const neutral = factors.filter((f) => f.weight === 0);
  const max = Math.max(...contributing.map((f) => f.weight), 1);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-xl border border-border bg-muted/50 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Triage score
            </p>
            <p className="font-display text-3xl font-semibold tabular-nums text-foreground">
              {score}
              <span className="text-base font-normal text-muted-foreground">/100</span>
            </p>
          </div>
          <span className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", meta.chip)}>
            {meta.label} priority
          </span>
        </div>

        <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-border">
          <div
            className={cn("h-full rounded-full transition-[width] duration-500", meta.bar)}
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
          <span>0 · Low</span>
          <span>{PRIORITY_THRESHOLDS.MODERATE} · Moderate</span>
          <span>{PRIORITY_THRESHOLDS.HIGH} · High</span>
          <span>100</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{meta.description}.</p>
      </div>

      {contributing.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No contributing factors"
          description="Record symptoms and vitals to generate a scoring breakdown."
        />
      ) : (
        <ul className="space-y-2.5">
          {contributing.map((factor, i) => {
            const Icon = kindIcon[factor.kind] ?? Activity;
            return (
              <li key={`${factor.label}-${i}`} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm text-foreground">{factor.label}</p>
                    <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
                      +{factor.weight}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full", meta.bar, "opacity-70")}
                      style={{ width: `${(factor.weight / max) * 100}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {kindLabel[factor.kind] ?? "Factor"}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {neutral.length > 0 && (
        <div className="rounded-xl border border-dashed border-border p-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Reassuring findings
          </p>
          <ul className="mt-1.5 space-y-1">
            {neutral.map((f, i) => (
              <li key={i} className="text-xs text-muted-foreground">
                · {f.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
