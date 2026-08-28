import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/rbac";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle, Clock3, Loader2, MapPin, Mic, Search, Siren, Stethoscope, Users, UserPlus,
} from "lucide-react";

import { PageHeader } from "@/components/care/page-header";
import { MetricCard } from "@/components/care/metric-card";
import { Panel } from "@/components/care/panel";
import { PatientCard } from "@/components/care/patient-card";
import { AssessmentPendingChip, PriorityChip, StatusChip } from "@/components/care/chips";
import { TriageBreakdown } from "@/components/care/triage-breakdown";
import { RfidScanner, type ScanState } from "@/components/care/rfid-scanner";
import { VitalsRow } from "@/components/care/vitals";
import { EmptyState } from "@/components/care/empty-state";
import { CardsSkeleton, TableSkeleton } from "@/components/care/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { usePatients, queryKeys } from "@/hooks/use-care-data";
import { useSession } from "@/hooks/use-session";
import { createPatient, findByRfid, promoteToEmergency, updatePatient } from "@/data/patients";
import { createAlert } from "@/data/alerts";
import type { Patient } from "@/data/types";
import { scoreTriage, priorityMeta, missingAssessment, type Priority } from "@/lib/triage";
import { nextPatientCode, randomRfid, waitMinutes } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/app/reception")({
  beforeLoad: () => requireRole(["receptionist", "nurse", "admin"]),
  head: () => ({
    meta: [
      { title: "Reception — CarePriority" },
      { name: "description", content: "Register patients, capture vitals and run the live triage queue." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReceptionPage,
});

const OVERFLOW_THRESHOLD = 8;
const emptyForm = {
  full_name: "",
  age: "",
  gender: "F",
  symptoms: "",
  temperature: "",
  heart_rate: "",
  spo2: "",
  rfid_tag: "",
};

function ReceptionPage() {
  const queryClient = useQueryClient();
  const { data: patients = [], isLoading } = usePatients();
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [listening, setListening] = useState(false);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanMessage, setScanMessage] = useState<string>();
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [emergencyTarget, setEmergencyTarget] = useState<Patient | null>(null);
  const [emergencyReason, setEmergencyReason] = useState("");
  const [emergencySearch, setEmergencySearch] = useState("");
  const { user } = useSession();

  const active = patients.filter((p) => p.status !== "completed");
  const waiting = patients.filter((p) => p.status === "waiting");
  const overflow = waiting.length >= OVERFLOW_THRESHOLD;

  const lanes = useMemo(() => {
    const grouped: Record<Priority, Patient[]> = { HIGH: [], MODERATE: [], LOW: [] };
    for (const p of active) grouped[p.priority].push(p);
    for (const key of Object.keys(grouped) as Priority[]) {
      grouped[key].sort((a, b) => a.queue_position - b.queue_position);
    }
    return grouped;
  }, [active]);

  const priorityRank: Record<Priority, number> = { HIGH: 0, MODERATE: 1, LOW: 2 };
  const emergencyCandidates = useMemo(() => {
    const q = emergencySearch.trim().toLowerCase();
    return waiting
      .filter(
        (p) =>
          !q ||
          p.full_name.toLowerCase().includes(q) ||
          p.patient_code.toLowerCase().includes(q) ||
          (p.rfid_tag ?? "").toLowerCase().includes(q),
      )
      .sort(
        (a, b) =>
          priorityRank[a.priority] - priorityRank[b.priority] || a.queue_position - b.queue_position,
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waiting, emergencySearch]);


  const filtered = patients.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.full_name.toLowerCase().includes(q) ||
      p.patient_code.toLowerCase().includes(q) ||
      (p.rfid_tag ?? "").toLowerCase().includes(q) ||
      p.symptoms.toLowerCase().includes(q)
    );
  });

  const preview = scoreTriage({
    symptoms: form.symptoms,
    temperature: form.temperature ? Number(form.temperature) : null,
    heartRate: form.heart_rate ? Number(form.heart_rate) : null,
    spo2: form.spo2 ? Number(form.spo2) : null,
    age: form.age ? Number(form.age) : null,
  });

  const register = useMutation({
    mutationFn: async () => {
      const age = Number(form.age);
      if (!form.full_name.trim() || !Number.isFinite(age) || age <= 0) {
        throw new Error("Enter a patient name and a valid age.");
      }
      const queuePosition =
        active.filter((p) => p.priority === preview.priority).length + 1;
      const patient = await createPatient({
        patient_code: nextPatientCode(),
        rfid_tag: form.rfid_tag.trim() || randomRfid(),
        full_name: form.full_name.trim(),
        age,
        gender: form.gender,
        symptoms: form.symptoms.trim(),
        temperature: form.temperature ? Number(form.temperature) : null,
        heart_rate: form.heart_rate ? Number(form.heart_rate) : null,
        spo2: form.spo2 ? Number(form.spo2) : null,
        priority: preview.priority,
        triage_score: preview.score,
        triage_factors: preview.factors,
        queue_position: queuePosition,
      });
      if (preview.priority === "HIGH") {
        await createAlert({
          kind: "triage",
          severity: "critical",
          title: `High priority patient — ${patient.full_name}`,
          message: `Triage score ${preview.score}/100. ${preview.factors[0]?.label ?? "Immediate review required"}.`,
          audience: "doctor",
          patient_id: patient.id,
        });
      }
      if (waiting.length + 1 >= OVERFLOW_THRESHOLD) {
        await createAlert({
          kind: "overflow",
          severity: "warning",
          title: "Waiting room approaching capacity",
          message: `${waiting.length + 1} patients now waiting. Consider re-routing low-priority cases.`,
          audience: "receptionist",
        });
      }
      return patient;
    },
    onSuccess: (patient) => {
      toast.success(`${patient.full_name} added to the queue`, {
        description: `${priorityMeta[patient.priority].label} priority · score ${patient.triage_score}`,
      });
      setForm(emptyForm);
      void queryClient.invalidateQueries({ queryKey: queryKeys.patients });
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const escalate = useMutation({
    mutationFn: async (patient: Patient) => {
      const actor = user?.email ?? "reception";
      const reason = emergencyReason.trim();
      await promoteToEmergency(patient, { reason, actor });
      await createAlert({
        kind: "emergency",
        severity: "critical",
        title: `Emergency override — ${patient.full_name}`,
        message: `${patient.patient_code} (was ${patient.priority} priority, queue #${patient.queue_position}) moved to position #1 by ${actor}. Reason: ${reason}`,
        audience: "doctor",
        patient_id: patient.id,
      });
    },
    onSuccess: () => {
      toast.success("Patient promoted to the front of the queue");
      setEmergencyOpen(false);
      setEmergencyTarget(null);
      setEmergencyReason("");
      void queryClient.invalidateQueries({ queryKey: queryKeys.patients });
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
    },

    onError: (err: Error) => toast.error(err.message),
  });

  async function handleScan(tag: string) {
    if (tag === "__scan__") {
      setScanState("scanning");
      setScanMessage("Hold the wristband near the reader…");
      window.setTimeout(() => {
        const fresh = randomRfid();
        setForm((f) => ({ ...f, rfid_tag: fresh }));
        setScanState("found");
        setScanMessage(`New wristband ${fresh} linked to this registration.`);
      }, 1200);
      return;
    }
    setScanState("scanning");
    const existing = await findByRfid(tag).catch(() => null);
    if (existing) {
      setScanState("found");
      setScanMessage(`${existing.full_name} is already registered (${existing.patient_code}).`);
      setSearch(existing.full_name);
    } else {
      setForm((f) => ({ ...f, rfid_tag: tag }));
      setScanState("found");
      setScanMessage(`Wristband ${tag} linked to this registration.`);
    }
  }

  function simulateVoiceCapture() {
    setListening(true);
    window.setTimeout(() => {
      setForm((f) => ({
        ...f,
        symptoms:
          "Patient reports chest tightness for the last 30 minutes with shortness of breath and nausea.",
      }));
      setListening(false);
      toast.success("Transcript captured", { description: "Review before adding to the queue." });
    }, 1400);
  }

  const avgWait = waiting.length
    ? Math.round(waiting.reduce((sum, p) => sum + waitMinutes(p.registered_at), 0) / waiting.length)
    : 0;

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Console", to: "/app/reception" }, { label: "Reception" }]}
        title="Live intake & queue"
        description="Register patients, capture vitals, and let the triage engine order the queue automatically."
        actions={
          <>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, ID, RFID…"
                aria-label="Search patients"
                className="h-9.5 w-full pl-9 sm:w-64"
              />
            </div>
            <Button
              variant="emergency"
              onClick={() => {
                setEmergencyTarget(null);
                setEmergencyReason("");
                setEmergencySearch("");
                setEmergencyOpen(true);
              }}
              disabled={waiting.length === 0}
            >
              <Siren className="h-4 w-4" /> Emergency
            </Button>
          </>
        }
      />

      {overflow && (
        <div
          role="alert"
          className="mb-6 flex flex-col gap-3 rounded-2xl border border-warning/35 bg-warning-soft p-4 sm:flex-row sm:items-center"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Overflow warning — {waiting.length} patients waiting
            </p>
            <p className="text-xs text-muted-foreground">
              Above the {OVERFLOW_THRESHOLD}-patient threshold. Consider re-routing low-priority cases.
            </p>
          </div>
          <Button size="sm" variant="outline">
            <MapPin className="h-3.5 w-3.5" /> Nearby facilities
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="High priority" value={lanes.HIGH.length} icon={Siren} tone="danger" loading={isLoading} />
        <MetricCard label="Waiting" value={waiting.length} icon={Users} tone="warning" loading={isLoading} />
        <MetricCard label="Average wait" value={`${avgWait}m`} icon={Clock3} tone="primary" loading={isLoading} />
        <MetricCard
          label="In consultation"
          value={patients.filter((p) => p.status === "in-consult").length}
          icon={Stethoscope}
          tone="success"
          loading={isLoading}
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-5 lg:mt-8">
        <div className="space-y-5 xl:col-span-2">
          <Panel
            title="Register patient"
            description="Every field feeds the triage engine in real time."
          >
            <form
              className="grid gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                register.mutate();
              }}
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label htmlFor="full_name">Full name</Label>
                  <Input
                    id="full_name"
                    required
                    maxLength={120}
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="e.g. Aarav Sharma"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min={0}
                    max={120}
                    required
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    placeholder="34"
                  />
                </div>
              </div>

              <fieldset className="grid gap-1.5">
                <legend className="mb-1.5 text-sm font-medium text-foreground">Gender</legend>
                <div className="flex gap-2" role="radiogroup">
                  {[
                    { value: "F", label: "Female" },
                    { value: "M", label: "Male" },
                    { value: "O", label: "Other" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={form.gender === option.value}
                      onClick={() => setForm({ ...form, gender: option.value })}
                      className={
                        form.gender === option.value
                          ? "flex-1 rounded-lg border border-primary bg-primary-light py-2 text-sm font-medium text-primary-hover"
                          : "flex-1 rounded-lg border border-border bg-surface py-2 text-sm text-muted-foreground transition-colors hover:border-primary/35"
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="symptoms">Presenting symptoms</Label>
                  <Button type="button" size="sm" variant="ghost" onClick={simulateVoiceCapture}>
                    {listening ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mic className="h-3.5 w-3.5" />}
                    {listening ? "Listening…" : "Voice capture"}
                  </Button>
                </div>
                <Textarea
                  id="symptoms"
                  rows={3}
                  maxLength={1000}
                  value={form.symptoms}
                  onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                  placeholder="Describe what the patient reports…"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="temperature">Temp °C</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    value={form.temperature}
                    onChange={(e) => setForm({ ...form, temperature: e.target.value })}
                    placeholder="37.0"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="heart_rate">HR bpm</Label>
                  <Input
                    id="heart_rate"
                    type="number"
                    value={form.heart_rate}
                    onChange={(e) => setForm({ ...form, heart_rate: e.target.value })}
                    placeholder="80"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="spo2">SpO₂ %</Label>
                  <Input
                    id="spo2"
                    type="number"
                    value={form.spo2}
                    onChange={(e) => setForm({ ...form, spo2: e.target.value })}
                    placeholder="98"
                  />
                </div>
              </div>

              <RfidScanner onScan={handleScan} state={scanState} message={scanMessage} />
              {form.rfid_tag && (
                <p className="text-xs text-muted-foreground">
                  Linked wristband: <span className="font-mono text-foreground">{form.rfid_tag}</span>
                </p>
              )}

              <Button type="submit" size="lg" disabled={register.isPending}>
                {register.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Add to queue
              </Button>
            </form>
          </Panel>

          <Panel title="Triage breakdown" description="Live preview of the score this registration will receive.">
            <TriageBreakdown score={preview.score} priority={preview.priority} factors={preview.factors} />
          </Panel>
        </div>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3 xl:col-span-3 xl:content-start">
          {(["HIGH", "MODERATE", "LOW"] as Priority[]).map((key) => (
            <Panel
              key={key}
              className="h-fit"
              title={`${priorityMeta[key].label} priority`}
              description={priorityMeta[key].description}
              actions={
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                  {lanes[key].length}
                </span>
              }
              bodyClassName="space-y-3"
            >
              {isLoading ? (
                <CardsSkeleton count={2} />
              ) : lanes[key].length === 0 ? (
                <EmptyState icon={Users} title="Lane clear" description="No patients in this lane right now." />
              ) : (
                lanes[key].map((patient) => (
                  <PatientCard key={patient.id} patient={patient} onEmergency={(p) => {
                      setEmergencyTarget(p);
                      setEmergencyReason("");
                      setEmergencySearch("");
                      setEmergencyOpen(true);
                    }} compact />
                ))
              )}
            </Panel>
          ))}
        </div>
      </div>

      <Panel
        className="mt-6 lg:mt-8"
        title="All patients today"
        description="Everyone registered in this session, newest activity first."
        flush
      >
        {isLoading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Search} title="No matching patients" description="Try a different name, ID or wristband tag." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Registered patients with triage results</caption>
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground [&>th]:px-5 [&>th]:py-3 [&>th]:font-medium">
                  <th scope="col">Patient</th>
                  <th scope="col">Age</th>
                  <th scope="col">Wristband</th>
                  <th scope="col">Vitals</th>
                  <th scope="col">Score</th>
                  <th scope="col">Priority</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-muted/50 [&>td]:px-5 [&>td]:py-3">
                    <td>
                      <div className="font-medium text-foreground">{p.full_name}</div>
                      <div className="text-xs text-muted-foreground">{p.patient_code}</div>
                    </td>
                    <td className="text-muted-foreground">
                      {p.age} · {p.gender}
                    </td>
                    <td className="font-mono text-xs text-muted-foreground">{p.rfid_tag ?? "—"}</td>
                    <td>
                      <VitalsRow temperature={p.temperature} heartRate={p.heart_rate} spo2={p.spo2} />
                    </td>
                    <td className="font-medium tabular-nums text-foreground">{p.triage_score}</td>
                    <td>
                      <PriorityChip priority={p.priority} />
                    </td>
                    <td>
                      <StatusChip status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Dialog
        open={emergencyOpen}
        onOpenChange={(open) => {
          setEmergencyOpen(open);
          if (!open) {
            setEmergencyTarget(null);
            setEmergencyReason("");
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-soft text-danger">
                <Siren className="h-4 w-4" />
              </span>
              Emergency override
            </DialogTitle>
            <DialogDescription>
              Select the patient experiencing the emergency. They will be moved to position #1 and the on-duty doctor
              alerted. All other patients keep their current order.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Waiting patients</Label>
            <Input
              value={emergencySearch}
              onChange={(e) => setEmergencySearch(e.target.value)}
              placeholder="Search name or RFID…"
              aria-label="Search waiting patients"
              className="h-9"
            />
            <div
              role="radiogroup"
              aria-label="Select patient for emergency override"
              className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border p-2"
            >
              {emergencyCandidates.length === 0 && (
                <p className="p-3 text-sm text-muted-foreground">No waiting patients match this search.</p>
              )}
              {emergencyCandidates.map((p) => {
                const selected = emergencyTarget?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setEmergencyTarget(p)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors ${
                      selected ? "border-danger bg-danger-soft" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{p.full_name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {p.patient_code} · RFID {p.rfid_tag ?? "—"} · Queue #{p.queue_position}
                      </span>
                    </span>
                    <PriorityChip priority={p.priority} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergency-reason">Override reason</Label>
            <Textarea
              id="emergency-reason"
              value={emergencyReason}
              onChange={(e) => setEmergencyReason(e.target.value)}
              placeholder="Describe the emergency (e.g. sudden collapse, severe bleeding)…"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEmergencyOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="emergency"
              disabled={escalate.isPending || !emergencyTarget || !emergencyReason.trim()}
              onClick={() => emergencyTarget && escalate.mutate(emergencyTarget)}
            >
              {escalate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Siren className="h-4 w-4" />}
              Confirm emergency override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}
