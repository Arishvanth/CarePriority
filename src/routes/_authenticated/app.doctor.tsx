import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/rbac";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle2, ClipboardList, Clock3, Loader2, PlayCircle, Siren, Stethoscope, UserRound,
} from "lucide-react";

import { PageHeader } from "@/components/care/page-header";
import { MetricCard } from "@/components/care/metric-card";
import { Panel } from "@/components/care/panel";
import { PatientCard } from "@/components/care/patient-card";
import { PriorityChip, StatusChip } from "@/components/care/chips";
import { TriageBreakdown } from "@/components/care/triage-breakdown";
import { RfidScanner, type ScanState } from "@/components/care/rfid-scanner";
import { VitalsRow } from "@/components/care/vitals";
import { EmptyState } from "@/components/care/empty-state";
import { CardsSkeleton } from "@/components/care/loading";
import { AssessmentDialog } from "@/components/care/assessment-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePatients, useConsultations, queryKeys } from "@/hooks/use-care-data";
import { useSession } from "@/hooks/use-session";
import { findByRfid, updatePatient } from "@/data/patients";
import { startConsultation, completeConsultation } from "@/data/consultations";
import { createAlert } from "@/data/alerts";
import type { Patient } from "@/data/types";
import { waitMinutes, relativeTime } from "@/lib/format";

type Outcome = "discharged" | "observation" | "referred";

const OUTCOMES: { value: Outcome; label: string; hint: string }[] = [
  { value: "discharged", label: "Discharged", hint: "Patient leaves the clinic; record kept in history." },
  { value: "observation", label: "Observation", hint: "Patient stays under observation for monitoring." },
  { value: "referred", label: "Referred", hint: "Patient referred onward; kept as a referral record." },
];

export const Route = createFileRoute("/_authenticated/app/doctor")({
  beforeLoad: () => requireRole(["doctor", "nurse", "admin"]),
  head: () => ({
    meta: [
      { title: "Doctor console — CarePriority" },
      { name: "description", content: "Scan wristbands, review triage evidence and record consultations." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DoctorPage,
});

function DoctorPage() {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const { data: patients = [], isLoading } = usePatients();
  const { data: consultations = [] } = useConsultations();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanMessage, setScanMessage] = useState<string>();
  const [activeConsultId, setActiveConsultId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Patient | null>(null);
  const [suppressAutoSelect, setSuppressAutoSelect] = useState(false);
  const [assessTarget, setAssessTarget] = useState<Patient | null>(null);

  const queue = useMemo(
    () =>
      patients
        .filter((p) => p.status === "waiting")
        .sort(
          (a, b) =>
            Number(b.emergency_override) - Number(a.emergency_override) ||
            b.triage_score - a.triage_score ||
            new Date(a.registered_at).getTime() - new Date(b.registered_at).getTime(),
        ),
    [patients],
  );

  const inConsult = patients.filter((p) => p.status === "in-consult");
  const selected = useMemo(() => {
    if (!selectedId && suppressAutoSelect) return null;
    return (
      patients.find((p) => p.id === selectedId) ?? inConsult[0] ?? queue[0] ?? null
    );
  }, [patients, selectedId, inConsult, queue, suppressAutoSelect]);

  useEffect(() => {
    if (!selectedId && selected) setSelectedId(selected.id);
  }, [selected, selectedId]);

  const begin = useMutation({
    mutationFn: async (patient: Patient) => {
      const id = await startConsultation(patient.id, user?.id ?? null);
      await updatePatient(patient.id, { status: "in-consult" });
      return id;
    },
    onSuccess: (id) => {
      setActiveConsultId(id);
      toast.success("Consultation started");
      void queryClient.invalidateQueries({ queryKey: queryKeys.patients });
      void queryClient.invalidateQueries({ queryKey: queryKeys.consultations });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const finish = useMutation({
    mutationFn: async (patient: Patient) => {
      if (!diagnosis.trim()) throw new Error("Record a diagnosis before completing.");
      if (!outcome) throw new Error("Select an outcome before completing.");
      if (activeConsultId) {
        await completeConsultation(activeConsultId, { notes: notes.trim(), diagnosis: diagnosis.trim(), outcome });
      }
      await updatePatient(patient.id, { status: outcome === "observation" ? "observation" : "completed" });
      if (outcome === "referred") {
        await createAlert({
          kind: "referral",
          severity: "warning",
          title: `Referral raised — ${patient.full_name}`,
          message: `${patient.patient_code} referred onward: ${diagnosis.trim()}.`,
          audience: "receptionist",
          patient_id: patient.id,
        });
      }
    },
    onSuccess: () => {
      toast.success("Consultation recorded");
      setActiveConsultId(null);
      setNotes("");
      setDiagnosis("");
      setOutcome(null);
      setConfirmTarget(null);
      setSuppressAutoSelect(true);
      setSelectedId(null);
      void queryClient.invalidateQueries({ queryKey: queryKeys.patients });
      void queryClient.invalidateQueries({ queryKey: queryKeys.consultations });
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  async function handleScan(tag: string) {
    if (tag === "__scan__") {
      const next = queue[0];
      if (!next) {
        setScanState("failed");
        setScanMessage("No patients waiting to call.");
        return;
      }
      setScanState("scanning");
      window.setTimeout(() => {
        setSelectedId(next.id);
        setScanState("found");
        setScanMessage(`${next.full_name} · ${next.patient_code} loaded from wristband.`);
      }, 900);
      return;
    }
    setScanState("scanning");
    const match = await findByRfid(tag).catch(() => null);
    if (match) {
      setSelectedId(match.id);
      setScanState("found");
      setScanMessage(`${match.full_name} · ${match.patient_code} loaded.`);
    } else {
      setScanState("failed");
      setScanMessage(`No patient found for wristband ${tag}. Use manual search instead.`);
    }
  }

  const completedToday = patients.filter((p) => p.status === "completed").length;

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Console", to: "/app/reception" }, { label: "Doctor" }]}
        title="Consultation console"
        description="The queue is ordered by triage score with emergency overrides pinned to the top."
        actions={
          selected && selected.status === "waiting" ? (
            <Button onClick={() => begin.mutate(selected)} disabled={begin.isPending}>
              {begin.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
              Start consultation
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Waiting" value={queue.length} icon={Clock3} tone="warning" loading={isLoading} />
        <MetricCard
          label="High priority"
          value={queue.filter((p) => p.priority === "HIGH").length}
          icon={Siren}
          tone="danger"
          loading={isLoading}
        />
        <MetricCard label="In consultation" value={inConsult.length} icon={Stethoscope} tone="primary" loading={isLoading} />
        <MetricCard label="Seen today" value={completedToday} icon={CheckCircle2} tone="success" loading={isLoading} />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-5 lg:mt-8">
        <div className="space-y-5 xl:col-span-2">
          <Panel title="Call next patient" description="Scan a wristband, or pick from the queue below.">
            <RfidScanner onScan={handleScan} state={scanState} message={scanMessage} label="Scan to call patient" />
          </Panel>

          <Panel
            title="Waiting queue"
            description="Highest clinical risk first."
            actions={
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                {queue.length}
              </span>
            }
            bodyClassName="space-y-3"
          >
            {isLoading ? (
              <CardsSkeleton />
            ) : queue.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="Queue is clear" description="Every waiting patient has been seen." />
            ) : (
              queue.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  onSelect={(p) => setSelectedId(p.id)}
                  selected={selected?.id === patient.id}
                  compact
                />
              ))
            )}
          </Panel>
        </div>

        <div className="space-y-5 xl:col-span-3">
          {!selected ? (
            <Panel title="Patient record">
              <EmptyState
                icon={UserRound}
                title="No patient selected"
                description="Scan a wristband or select someone from the waiting queue to see their clinical context."
              />
            </Panel>
          ) : (
            <>
              <Panel
                title={selected.full_name}
                description={`${selected.patient_code} · ${selected.age}${selected.gender} · registered ${relativeTime(selected.registered_at)}`}
                actions={
                  <>
                    <PriorityChip priority={selected.priority} />
                    <StatusChip status={selected.status} />
                    <Button size="sm" variant="outline" onClick={() => setAssessTarget(selected)}>
                      <ClipboardList className="h-4 w-4" /> Update vitals
                    </Button>
                  </>
                }
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-muted/40 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Presenting symptoms
                    </p>
                    <p className="mt-1.5 text-sm text-foreground">{selected.symptoms || "None recorded."}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/40 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Medical history
                    </p>
                    {selected.medical_history.length === 0 ? (
                      <p className="mt-1.5 text-sm text-muted-foreground">No recorded history.</p>
                    ) : (
                      <ul className="mt-1.5 space-y-1 text-sm text-foreground">
                        {selected.medical_history.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
                  <VitalsRow
                    temperature={selected.temperature}
                    heartRate={selected.heart_rate}
                    spo2={selected.spo2}
                  />
                  <span className="text-xs text-muted-foreground">
                    Waiting {waitMinutes(selected.registered_at)} minutes
                  </span>
                </div>
              </Panel>

              <Panel title="Why this priority" description="Every point in the triage score, itemised.">
                <TriageBreakdown
                  score={selected.triage_score}
                  priority={selected.priority}
                  factors={selected.triage_factors}
                />
              </Panel>

              <Panel title="Consultation record" description="Saved to the patient's clinical history.">
                <form
                  className="grid gap-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!diagnosis.trim()) {
                      toast.error("Record a diagnosis before completing.");
                      return;
                    }
                    if (!outcome) {
                      toast.error("Select an outcome before completing.");
                      return;
                    }
                    setConfirmTarget(selected);
                  }}
                >
                  <div className="grid gap-1.5">
                    <Label htmlFor="diagnosis">Diagnosis</Label>
                    <Input
                      id="diagnosis"
                      maxLength={200}
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      placeholder="e.g. Acute bronchitis"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="notes">Clinical notes</Label>
                    <Textarea
                      id="notes"
                      rows={4}
                      maxLength={2000}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Examination findings, treatment given, advice…"
                    />
                  </div>
                  <fieldset>
                    <legend className="mb-1.5 text-sm font-medium text-foreground">
                      Outcome <span className="text-destructive">*</span>
                    </legend>
                    <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Consultation outcome">
                      {OUTCOMES.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={outcome === option.value}
                          onClick={() => setOutcome(option.value)}
                          className={
                            outcome === option.value
                              ? "rounded-lg border border-primary bg-primary-light px-3.5 py-2 text-left text-sm font-medium text-primary-hover"
                              : "rounded-lg border border-border bg-surface px-3.5 py-2 text-left text-sm text-muted-foreground transition-colors hover:border-primary/35"
                          }
                        >
                          <span className="block">{option.label}</span>
                          <span className="mt-0.5 block text-xs font-normal opacity-80">{option.hint}</span>
                        </button>
                      ))}
                    </div>
                    {!outcome && (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        Select an outcome to complete this consultation.
                      </p>
                    )}
                  </fieldset>
                  <div className="flex flex-wrap gap-2">
                    {selected.status === "waiting" && (
                      <Button type="button" variant="outline" onClick={() => begin.mutate(selected)} disabled={begin.isPending}>
                        <PlayCircle className="h-4 w-4" /> Start consultation
                      </Button>
                    )}
                    <Button type="submit" disabled={finish.isPending}>
                      {finish.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Complete & release
                    </Button>
                  </div>
                </form>
              </Panel>
            </>
          )}

          <Panel title="Recent consultations" description="Latest completed records across the clinic." flush>
            {consultations.length === 0 ? (
              <EmptyState icon={ClipboardList} title="No consultations yet" description="Completed visits will be listed here." />
            ) : (
              <ul className="divide-y divide-border">
                {consultations.slice(0, 6).map((c) => {
                  const patient = patients.find((p) => p.id === c.patient_id);
                  return (
                    <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {patient?.full_name ?? "Unknown patient"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.diagnosis || "Diagnosis pending"}
                        </p>
                      </div>
                      <span className="text-xs capitalize text-muted-foreground">{c.outcome || "—"}</span>
                      <span className="text-xs text-muted-foreground">{relativeTime(c.started_at)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <AssessmentDialog patient={assessTarget} onOpenChange={(open) => !open && setAssessTarget(null)} />
    </>
  );
}
