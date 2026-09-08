import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { History, Search, X } from "lucide-react";

import { requireRole } from "@/lib/rbac";
import { PageHeader } from "@/components/care/page-header";
import { Panel } from "@/components/care/panel";
import { EmptyState } from "@/components/care/empty-state";
import { TableSkeleton } from "@/components/care/loading";
import { PriorityChip, StatusChip } from "@/components/care/chips";
import { VitalsRow } from "@/components/care/vitals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePatients, useConsultations, useObservationEvents, useReferrals } from "@/hooks/use-care-data";
import { Link } from "@tanstack/react-router";
import type { Patient, Consultation } from "@/data/types";
import { relativeTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/app/history")({
  beforeLoad: () => requireRole(["doctor", "admin"]),
  head: () => ({
    meta: [
      { title: "Patient history — CarePriority" },
      { name: "description", content: "Read-only record of past consultations, outcomes and observation timelines." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HistoryPage,
});

const selectClass =
  "h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const OUTCOMES = ["all", "discharged", "observation", "referred"] as const;

function HistoryPage() {
  const { data: patients = [], isLoading } = usePatients();
  const { data: consultations = [] } = useConsultations();
  const { data: events = [] } = useObservationEvents();
  const { data: referrals = [] } = useReferrals();

  const [query, setQuery] = useState("");
  const [outcome, setOutcome] = useState<(typeof OUTCOMES)[number]>("all");
  const [sort, setSort] = useState<"recent" | "oldest">("recent");
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const byId = new Map(patients.map((p) => [p.id, p] as const));
    const q = query.trim().toLowerCase();
    return consultations
      .filter((c) => c.ended_at)
      .map((c) => ({ consultation: c, patient: byId.get(c.patient_id) }))
      .filter((r): r is { consultation: Consultation; patient: Patient } => !!r.patient)
      .filter(
        (r) =>
          !q ||
          r.patient.full_name.toLowerCase().includes(q) ||
          r.patient.patient_code.toLowerCase().includes(q) ||
          (r.patient.rfid_tag ?? "").toLowerCase().includes(q),
      )
      .filter((r) => outcome === "all" || (r.consultation.final_outcome || r.consultation.outcome) === outcome)
      .sort((a, b) => {
        const at = new Date(a.consultation.ended_at ?? a.consultation.started_at).getTime();
        const bt = new Date(b.consultation.ended_at ?? b.consultation.started_at).getTime();
        return sort === "recent" ? bt - at : at - bt;
      });
  }, [patients, consultations, query, outcome, sort]);

  const open = rows.find((r) => r.consultation.id === openId) ?? null;
  const openReferral = open
    ? referrals.find(
        (r) => r.consultation_id === open.consultation.id || r.patient_id === open.patient.id,
      ) ?? null
    : null;

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Console", to: "/app/doctor" }, { label: "Patient history" }]}
        title="Patient history"
        description="Every completed consultation with its outcome and observation timeline. Records here are read-only."
      />

      <Panel
        title="Completed records"
        description={`${rows.length} record${rows.length === 1 ? "" : "s"}`}
        bodyClassName="space-y-4"
      >
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search name, patient ID or RFID"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search patient history"
            />
          </div>
          <select
            className={selectClass}
            value={outcome}
            onChange={(e) => setOutcome(e.target.value as (typeof OUTCOMES)[number])}
            aria-label="Filter by outcome"
          >
            {OUTCOMES.map((o) => (
              <option key={o} value={o}>
                {o === "all" ? "All outcomes" : o[0].toUpperCase() + o.slice(1)}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={sort}
            onChange={(e) => setSort(e.target.value as "recent" | "oldest")}
            aria-label="Sort history"
          >
            <option value="recent">Sort: most recent first</option>
            <option value="oldest">Sort: oldest first</option>
          </select>
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={History}
            title="No completed records yet"
            description="Consultations appear here once a doctor finalises an outcome."
          />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Patient</th>
                  <th className="py-2 pr-3 font-medium">Outcome</th>
                  <th className="py-2 pr-3 font-medium">Diagnosis</th>
                  <th className="py-2 pr-3 font-medium">Completed</th>
                  <th className="py-2 font-medium sr-only">Details</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ consultation, patient }) => (
                  <tr key={consultation.id} className="border-b border-border/70 last:border-0">
                    <td className="py-3 pr-3">
                      <p className="font-medium text-foreground">{patient.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {patient.patient_code}
                        {patient.rfid_tag ? ` · ${patient.rfid_tag}` : ""}
                      </p>
                    </td>
                    <td className="py-3 pr-3 capitalize">
                      {consultation.final_outcome || consultation.outcome || "—"}
                    </td>
                    <td className="max-w-[220px] py-3 pr-3 text-muted-foreground">
                      {consultation.diagnosis || "Not recorded"}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-3 text-muted-foreground">
                      {consultation.ended_at ? relativeTime(consultation.ended_at) : "—"}
                    </td>
                    <td className="py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => setOpenId(consultation.id)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {open && (
        <Panel
          className="mt-6"
          title={`${open.patient.full_name} — record detail`}
          description="Read-only history. Nothing on this page can be edited."
          actions={
            <Button size="sm" variant="ghost" onClick={() => setOpenId(null)} aria-label="Close record detail">
              <X className="h-4 w-4" /> Close
            </Button>
          }
          bodyClassName="space-y-5"
        >
          <div className="flex flex-wrap items-center gap-2">
            <PriorityChip priority={open.patient.priority} />
            <StatusChip status={open.patient.status} />
            <span className="text-xs text-muted-foreground">
              {open.patient.age}
              {open.patient.gender} · registered {relativeTime(open.patient.registered_at)}
            </span>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <Detail label="Symptoms" value={open.patient.symptoms || "Not recorded"} />
            <Detail label="Diagnosis" value={open.consultation.diagnosis || "Not recorded"} />
            <Detail label="Outcome" value={open.consultation.final_outcome || open.consultation.outcome || "—"} />
            <Detail
              label="Room / bed"
              value={
                open.patient.room_number
                  ? `Room ${open.patient.room_number}${open.patient.bed_number ? ` · Bed ${open.patient.bed_number}` : ""}`
                  : "Not assigned"
              }
            />
            <Detail label="Consultation notes" value={open.consultation.notes || "No notes recorded"} />
            <Detail label="Referral note" value={open.consultation.referral_note || "—"} />
          </dl>

          {openReferral && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-4">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Referral record</p>
                <p className="mt-0.5 break-words text-sm text-foreground">
                  {openReferral.destination || "Destination not recorded"} · status {openReferral.status}
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to="/app/referrals">Open in Referrals</Link>
              </Button>
            </div>
          )}

          <div className="rounded-xl border border-border p-3">
            <VitalsRow
              temperature={open.patient.temperature}
              heartRate={open.patient.heart_rate}
              spo2={open.patient.spo2}
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Observation timeline</p>
            {events.filter((e) => e.patient_id === open.patient.id).length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">This patient was never placed under observation.</p>
            ) : (
              <ol className="mt-2 space-y-2">
                {events
                  .filter((e) => e.patient_id === open.patient.id)
                  .map((entry) => (
                    <li key={entry.id} className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                      <p className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                        <span>{new Date(entry.created_at).toLocaleString()}</span>
                        <span>
                          {entry.author_name || "Staff"} · {entry.kind}
                        </span>
                      </p>
                      <p className="mt-1 text-foreground">{entry.condition || "Condition unchanged"}</p>
                      {entry.notes && <p className="mt-1 text-muted-foreground">{entry.notes}</p>}
                    </li>
                  ))}
              </ol>
            )}
          </div>
        </Panel>
      )}
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap break-words text-foreground">{value}</dd>
    </div>
  );
}
