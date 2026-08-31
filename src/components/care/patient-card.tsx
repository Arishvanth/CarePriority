import { ArrowUp, Clock, HeartPulse, IdCard, Siren, Thermometer, Wind } from "lucide-react";
import type { Patient } from "@/data/types";
import { priorityMeta, missingAssessment } from "@/lib/triage";
import { initials, waitMinutes } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AssessmentPendingChip, PriorityChip, StatusChip } from "./chips";
import { Button } from "@/components/ui/button";

interface PatientCardProps {
  patient: Patient;
  onSelect?: (patient: Patient) => void;
  onEmergency?: (patient: Patient) => void;
  selected?: boolean;
  compact?: boolean;
}

function Vital({
  icon: Icon,
  label,
  value,
  warn,
}: {
  icon: typeof Thermometer;
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-lg border border-border/70 bg-muted/40 px-1.5 py-1">
      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3 shrink-0" aria-hidden="true" /> {label}
      </span>
      <span
        className={cn(
          "whitespace-nowrap text-[13px] font-medium leading-tight tabular-nums",
          warn ? "text-danger" : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function PatientCard({ patient, onSelect, onEmergency, selected, compact }: PatientCardProps) {
  const meta = priorityMeta[patient.priority];
  const waited = waitMinutes(patient.registered_at);
  const missing = missingAssessment(patient);
  const canEscalate = Boolean(onEmergency) && patient.status === "waiting" && !patient.emergency_override;

  const open = () => onSelect?.(patient);

  return (
    <article
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect ? open : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open();
              }
            }
          : undefined
      }
      aria-label={onSelect ? `Open record for ${patient.full_name}` : undefined}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-surface p-3 pl-4 text-left transition-all duration-200",
        onSelect && "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        selected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/35 hover:shadow-soft",
      )}
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", meta.bar)} aria-hidden="true" />

      {/* Identity */}
      <div className="flex items-start gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-foreground">
          {initials(patient.full_name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {patient.full_name}
              <span className="ml-1.5 font-normal text-muted-foreground">
                {patient.age}
                {patient.gender}
              </span>
            </h3>
            {patient.emergency_override && (
              <Siren className="h-3.5 w-3.5 shrink-0 text-danger" aria-label="Emergency override" />
            )}
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 truncate">
              <IdCard className="h-3 w-3" aria-hidden="true" />
              {patient.patient_code}
              {patient.rfid_tag ? ` · ${patient.rfid_tag}` : ""}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" /> {waited}m
            </span>
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="block font-display text-xl font-semibold leading-none tabular-nums text-foreground">
            {patient.triage_score}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">score</span>
        </div>
      </div>

      {/* Status row */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <PriorityChip priority={patient.priority} />
        <StatusChip status={patient.status} />
        {patient.queue_position > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
            Queue #{patient.queue_position}
          </span>
        )}
        {missing.length > 0 && <AssessmentPendingChip />}
      </div>

      {/* Vitals */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Vital
          icon={Thermometer}
          label="Temp"
          value={patient.temperature === null ? "—" : `${patient.temperature}°C`}
          warn={patient.temperature !== null && patient.temperature >= 38.3}
        />
        <Vital
          icon={HeartPulse}
          label="HR"
          value={patient.heart_rate === null ? "—" : `${patient.heart_rate}`}
          warn={patient.heart_rate !== null && (patient.heart_rate >= 110 || patient.heart_rate <= 50)}
        />
        <Vital
          icon={Wind}
          label="SpO₂"
          value={patient.spo2 === null ? "—" : `${patient.spo2}%`}
          warn={patient.spo2 !== null && patient.spo2 < 94}
        />
      </div>

      {!compact && patient.symptoms && (
        <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{patient.symptoms}</p>
      )}

      {canEscalate && (
        <div className="mt-3 border-t border-border/70 pt-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-danger hover:bg-danger-soft hover:text-danger"
            onClick={(e) => {
              e.stopPropagation();
              onEmergency?.(patient);
            }}
          >
            <ArrowUp className="h-3.5 w-3.5" /> Emergency override
          </Button>
        </div>
      )}
    </article>
  );
}
