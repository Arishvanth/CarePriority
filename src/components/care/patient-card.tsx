import { ArrowUp, Clock, Siren } from "lucide-react";
import type { Patient } from "@/data/types";
import { priorityMeta } from "@/lib/triage";
import { initials, waitMinutes } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PriorityChip, StatusChip } from "./chips";
import { VitalsRow } from "./vitals";
import { Button } from "@/components/ui/button";

interface PatientCardProps {
  patient: Patient;
  onSelect?: (patient: Patient) => void;
  onEmergency?: (patient: Patient) => void;
  selected?: boolean;
  compact?: boolean;
}

export function PatientCard({ patient, onSelect, onEmergency, selected, compact }: PatientCardProps) {
  const meta = priorityMeta[patient.priority];
  const waited = waitMinutes(patient.registered_at);

  return (
    <article
      className={cn(
        "group relative rounded-xl border bg-surface p-3.5 text-left transition-all duration-200",
        selected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/35 hover:shadow-soft",
      )}
    >
      <span
        className={cn("absolute inset-y-3 left-0 w-1 rounded-r-full", meta.bar)}
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={() => onSelect?.(patient)}
        className="flex w-full items-start gap-3 pl-2 text-left"
        aria-label={`Open ${patient.full_name}`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
          {initials(patient.full_name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-foreground">{patient.full_name}</span>
            {patient.emergency_override && (
              <Siren className="h-3.5 w-3.5 shrink-0 text-danger" aria-label="Emergency override" />
            )}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            <span>
              {patient.patient_code} · {patient.age}
              {patient.gender}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" /> {waited}m
            </span>
          </span>
          {!compact && (
            <span className="mt-1.5 line-clamp-2 block text-xs text-muted-foreground">{patient.symptoms}</span>
          )}
        </span>
        <span className="shrink-0 text-right">
          <span className="block font-display text-lg font-semibold tabular-nums text-foreground">
            {patient.triage_score}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">score</span>
        </span>
      </button>

      <div className="mt-3 flex flex-wrap items-center gap-2 pl-2">
        <PriorityChip priority={patient.priority} />
        <StatusChip status={patient.status} />
        <VitalsRow
          className="ml-auto"
          temperature={patient.temperature}
          heartRate={patient.heart_rate}
          spo2={patient.spo2}
        />
      </div>

      {onEmergency && patient.status === "waiting" && !patient.emergency_override && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="mt-2 ml-2 h-7 text-xs text-danger hover:bg-danger-soft hover:text-danger"
          onClick={() => onEmergency(patient)}
        >
          <ArrowUp className="h-3.5 w-3.5" /> Emergency override
        </Button>
      )}
    </article>
  );
}
