import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Activity, BedDouble, ClipboardList, Loader2, Search, Stethoscope } from "lucide-react";

import { requireRole } from "@/lib/rbac";
import { PageHeader } from "@/components/care/page-header";
import { Panel } from "@/components/care/panel";
import { MetricCard } from "@/components/care/metric-card";
import { EmptyState } from "@/components/care/empty-state";
import { CardsSkeleton } from "@/components/care/loading";
import { PriorityChip } from "@/components/care/chips";
import { VitalsRow } from "@/components/care/vitals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { usePatients, useConsultations, useObservationEvents, queryKeys } from "@/hooks/use-care-data";
import { useSession, useProfile } from "@/hooks/use-session";
import { updatePatient } from "@/data/patients";
import { addObservationEvent, type ObservationEvent } from "@/data/observations";
import { setFinalOutcome } from "@/data/consultations";
import { createAlert } from "@/data/alerts";
import { createReferral } from "@/data/referrals";
import type { Patient } from "@/data/types";
import { relativeTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/app/observation")({
  beforeLoad: () => requireRole(["doctor", "admin"]),
  head: () => ({
    meta: [
      { title: "Observation monitoring — CarePriority" },
      { name: "description", content: "Monitor patients under observation, update vitals, rooms and clinical notes." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ObservationPage,
});

const selectClass =
  "h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type SortKey = "started" | "updated";

function ObservationPage() {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const profile = useProfile(user?.id);
  const { data: patients = [], isLoading } = usePatients();
  const { data: consultations = [] } = useConsultations();
  const { data: events = [] } = useObservationEvents();

  const [query, setQuery] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("started");
  const [updateTarget, setUpdateTarget] = useState<Patient | null>(null);
  const [exitTarget, setExitTarget] = useState<{ patient: Patient; outcome: "discharged" | "referred" } | null>(null);
  const [exitDestination, setExitDestination] = useState("");

  const observed = useMemo(() => patients.filter((p) => p.status === "observation"), [patients]);

  const doctorNames = useMemo(() => {
    const ids = new Set(observed.map((p) => p.observation_doctor_id).filter(Boolean) as string[]);
    return Array.from(ids);
  }, [observed]);

  const rooms = useMemo(
    () => Array.from(new Set(observed.map((p) => p.room_number).filter(Boolean) as string[])),
    [observed],
  );

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return observed
      .filter(
        (p) =>
          !q || p.full_name.toLowerCase().includes(q) || p.patient_code.toLowerCase().includes(q),
      )
      .filter((p) => doctorFilter === "all" || p.observation_doctor_id === doctorFilter)
      .filter((p) => roomFilter === "all" || (p.room_number ?? "") === roomFilter)
      .sort((a, b) =>
        sort === "started"
          ? new Date(a.observation_started_at ?? a.registered_at).getTime() -
            new Date(b.observation_started_at ?? b.registered_at).getTime()
          : new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      );
  }, [observed, query, doctorFilter, roomFilter, sort]);

  const exit = useMutation({
    mutationFn: async ({
      patient,
      outcome,
      destination = "",
    }: {
      patient: Patient;
      outcome: "discharged" | "referred";
      destination?: string;
    }) => {
      const consult = consultations.find((c) => c.patient_id === patient.id);
      if (consult) await setFinalOutcome(consult.id, outcome);
      await addObservationEvent({
        patient_id: patient.id,
        consultation_id: consult?.id ?? null,
        author_id: user?.id ?? null,
        author_name: profile?.full_name || user?.email || "Staff",
        kind: outcome,
        condition: patient.condition,
        room_number: patient.room_number,
        bed_number: patient.bed_number,
        temperature: patient.temperature,
        heart_rate: patient.heart_rate,
        spo2: patient.spo2,
        notes: outcome === "referred" ? "Referred onward from observation." : "Discharged from observation.",
      });
      await updatePatient(patient.id, { status: "completed" });
      if (outcome === "referred") {
        await createReferral({
          patient_id: patient.id,
          consultation_id: consult?.id ?? null,
          doctor_id: user?.id ?? null,
          doctor_name: profile?.full_name || user?.email || "Doctor",
          diagnosis: consult?.diagnosis ?? patient.condition,
          notes: consult?.notes ?? "",
          reason: "Referred onward from observation.",
          destination: "",
        });
        await createAlert({
          kind: "referral",
          severity: "warning",
          title: `Referral from observation — ${patient.full_name}`,
          message: `${patient.patient_code} referred onward after observation.`,
          audience: "receptionist",
          patient_id: patient.id,
        });
      }
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.outcome === "referred" ? "Patient referred" : "Patient discharged");
      setExitTarget(null);
      void queryClient.invalidateQueries({ queryKey: queryKeys.patients });
      void queryClient.invalidateQueries({ queryKey: queryKeys.consultations });
      void queryClient.invalidateQueries({ queryKey: queryKeys.observations });
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
      void queryClient.invalidateQueries({ queryKey: queryKeys.referrals });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Console", to: "/app/doctor" }, { label: "Observation" }]}
        title="Observation monitoring"
        description="Patients kept under observation after consultation, with their live vitals and timeline."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Under observation" value={observed.length} icon={Activity} tone="primary" loading={isLoading} />
        <MetricCard
          label="Rooms in use"
          value={rooms.length}
          icon={BedDouble}
          tone="success"
          loading={isLoading}
        />
        <MetricCard
          label="Awaiting room"
          value={observed.filter((p) => !p.room_number).length}
          icon={BedDouble}
          tone="warning"
          loading={isLoading}
        />
        <MetricCard
          label="Updates logged"
          value={events.length}
          icon={ClipboardList}
          tone="primary"
          loading={isLoading}
        />
      </div>

      <Panel
        className="mt-6"
        title="Monitoring list"
        description="Search, filter and sort the patients you are monitoring."
        bodyClassName="space-y-4"
      >
        <div className="grid gap-3 lg:grid-cols-4">
          <div className="relative lg:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search name or patient ID"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search observation patients"
            />
          </div>
          <select
            className={selectClass}
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            aria-label="Filter by assigned doctor"
          >
            <option value="all">All doctors</option>
            {doctorNames.map((id) => (
              <option key={id} value={id}>
                {id === user?.id ? "Assigned to me" : `Doctor ${id.slice(0, 8)}`}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            aria-label="Filter by room"
          >
            <option value="all">All rooms</option>
            {rooms.map((r) => (
              <option key={r} value={r}>
                Room {r}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort observation list"
          >
            <option value="started">Sort: observation start time</option>
            <option value="updated">Sort: last updated</option>
          </select>
        </div>

        {isLoading ? (
          <CardsSkeleton />
        ) : list.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No patients under observation"
            description="Patients marked as Observation after a consultation appear here."
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {list.map((patient) => (
              <ObservationCard
                key={patient.id}
                patient={patient}
                timeline={events.filter((e) => e.patient_id === patient.id)}
                onUpdate={() => setUpdateTarget(patient)}
                onExit={(outcome) => setExitTarget({ patient, outcome })}
              />
            ))}
          </div>
        )}
      </Panel>

      <ObservationUpdateDialog patient={updateTarget} onOpenChange={(o) => !o && setUpdateTarget(null)} />

      <Dialog
        open={!!exitTarget}
        onOpenChange={(o) => {
          if (!o) {
            setExitTarget(null);
            setExitDestination("");
          }
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md overflow-x-hidden rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {exitTarget?.outcome === "referred" ? "Refer patient onward" : "Discharge from observation"}
            </DialogTitle>
            <DialogDescription>
              {exitTarget?.patient.full_name} leaves the observation dashboard. The full observation history is
              preserved in Patient History.
            </DialogDescription>
          </DialogHeader>
          {exitTarget?.outcome === "referred" && (
            <div className="space-y-1.5">
              <Label htmlFor="exit-destination">Referral destination</Label>
              <Input
                id="exit-destination"
                value={exitDestination}
                onChange={(e) => setExitDestination(e.target.value)}
                placeholder="Receiving hospital, department or facility"
              />
              <p className="text-xs text-muted-foreground">
                Required — this is recorded on the referral record.
              </p>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setExitTarget(null);
                setExitDestination("");
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={
                exit.isPending ||
                (exitTarget?.outcome === "referred" && !exitDestination.trim())
              }
              onClick={() =>
                exitTarget && exit.mutate({ ...exitTarget, destination: exitDestination.trim() })
              }
            >
              {exit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ObservationCard({
  patient,
  timeline,
  onUpdate,
  onExit,
}: {
  patient: Patient;
  timeline: ObservationEvent[];
  onUpdate: () => void;
  onExit: (outcome: "discharged" | "referred") => void;
}) {
  return (
    <article className="panel flex flex-col gap-4 rounded-2xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-display text-base font-semibold text-foreground">{patient.full_name}</h3>
          <p className="text-xs text-muted-foreground">
            {patient.patient_code} · {patient.age}
            {patient.gender} · started {relativeTime(patient.observation_started_at ?? patient.updated_at)}
          </p>
        </div>
        <PriorityChip priority={patient.priority} />
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Room / bed</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {patient.room_number
              ? `Room ${patient.room_number}${patient.bed_number ? ` · Bed ${patient.bed_number}` : ""}`
              : "Room not assigned"}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Condition</dt>
          <dd className="mt-0.5 font-medium text-foreground">{patient.condition || "Not recorded"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Assigned doctor</dt>
          <dd className="mt-0.5 text-foreground">
            {patient.observation_doctor_id ? `Doctor ${patient.observation_doctor_id.slice(0, 8)}` : "Unassigned"}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Last updated</dt>
          <dd className="mt-0.5 text-foreground">{relativeTime(patient.updated_at)}</dd>
        </div>
      </dl>

      <div className="rounded-xl border border-border p-3">
        <VitalsRow temperature={patient.temperature} heartRate={patient.heart_rate} spo2={patient.spo2} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={onUpdate}>
          <ClipboardList className="h-4 w-4" /> Update observation
        </Button>
        <Button size="sm" variant="outline" onClick={() => onExit("discharged")}>
          Discharge
        </Button>
        <Button size="sm" variant="outline" onClick={() => onExit("referred")}>
          Refer
        </Button>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Observation timeline</p>
        {timeline.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No updates recorded yet.</p>
        ) : (
          <ol className="mt-2 space-y-2">
            {timeline.slice(0, 4).map((entry) => (
              <li key={entry.id} className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                <p className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                  <span>{new Date(entry.created_at).toLocaleString()}</span>
                  <span>{entry.author_name || "Staff"}</span>
                </p>
                <p className="mt-1 text-foreground">
                  {entry.condition || "Condition unchanged"}
                  <span className="ml-1 text-muted-foreground tabular-nums">
                    {entry.temperature !== null ? ` · ${entry.temperature}°C` : ""}
                    {entry.heart_rate !== null ? ` · ${entry.heart_rate} bpm` : ""}
                    {entry.spo2 !== null ? ` · ${entry.spo2}%` : ""}
                  </span>
                </p>
                {entry.notes && <p className="mt-1 text-muted-foreground">{entry.notes}</p>}
              </li>
            ))}
          </ol>
        )}
      </div>
    </article>
  );
}

function ObservationUpdateDialog({
  patient,
  onOpenChange,
}: {
  patient: Patient | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const profile = useProfile(user?.id);
  const { data: consultations = [] } = useConsultations();
  const [form, setForm] = useState({
    room_number: "",
    bed_number: "",
    condition: "",
    temperature: "",
    heart_rate: "",
    spo2: "",
    notes: "",
  });
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  if (patient && loadedFor !== patient.id) {
    setLoadedFor(patient.id);
    setForm({
      room_number: patient.room_number ?? "",
      bed_number: patient.bed_number ?? "",
      condition: patient.condition ?? "",
      temperature: patient.temperature === null ? "" : String(patient.temperature),
      heart_rate: patient.heart_rate === null ? "" : String(patient.heart_rate),
      spo2: patient.spo2 === null ? "" : String(patient.spo2),
      notes: "",
    });
  }

  const save = useMutation({
    mutationFn: async (target: Patient) => {
      const temperature = form.temperature.trim() ? Number(form.temperature) : null;
      const heart_rate = form.heart_rate.trim() ? Number(form.heart_rate) : null;
      const spo2 = form.spo2.trim() ? Number(form.spo2) : null;
      const room_number = form.room_number.trim() || null;
      const bed_number = form.bed_number.trim() || null;
      const condition = form.condition.trim();

      await updatePatient(target.id, { temperature, heart_rate, spo2, room_number, bed_number, condition });
      await addObservationEvent({
        patient_id: target.id,
        consultation_id: consultations.find((c) => c.patient_id === target.id)?.id ?? null,
        author_id: user?.id ?? null,
        author_name: profile?.full_name || user?.email || "Staff",
        kind: "update",
        condition,
        room_number,
        bed_number,
        temperature,
        heart_rate,
        spo2,
        notes: form.notes.trim(),
      });
    },
    onSuccess: () => {
      toast.success("Observation updated");
      onOpenChange(false);
      setLoadedFor(null);
      void queryClient.invalidateQueries({ queryKey: queryKeys.patients });
      void queryClient.invalidateQueries({ queryKey: queryKeys.observations });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={!!patient} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto overflow-x-hidden rounded-2xl p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Update observation</DialogTitle>
          <DialogDescription>
            {patient?.full_name} · {patient?.patient_code}. Each save adds a timestamped timeline entry.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid min-w-0 gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (patient) save.mutate(patient);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Room number" value={form.room_number} onChange={(v) => setForm({ ...form, room_number: v })} placeholder="e.g. 12" />
            <Field label="Bed number" value={form.bed_number} onChange={(v) => setForm({ ...form, bed_number: v })} placeholder="e.g. B2" />
          </div>
          <Field label="Current condition" value={form.condition} onChange={(v) => setForm({ ...form, condition: v })} placeholder="e.g. Stable, responding to fluids" />
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Temp (°C)" value={form.temperature} onChange={(v) => setForm({ ...form, temperature: v })} placeholder="37.0" inputMode="decimal" />
            <Field label="Heart rate" value={form.heart_rate} onChange={(v) => setForm({ ...form, heart_rate: v })} placeholder="80" inputMode="numeric" />
            <Field label="SpO₂ (%)" value={form.spo2} onChange={(v) => setForm({ ...form, spo2: v })} placeholder="98" inputMode="numeric" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="obs-notes">Clinical note</Label>
            <Textarea
              id="obs-notes"
              rows={3}
              maxLength={2000}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Observation findings, treatment given…"
            />
          </div>
          <DialogFooter className="mt-1 gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Stethoscope className="h-4 w-4" />}
              Save update
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "decimal" | "numeric";
}) {
  const id = `obs-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div className="grid min-w-0 gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} inputMode={inputMode} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
