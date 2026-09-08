import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Search, Send, X } from "lucide-react";

import { requireRole } from "@/lib/rbac";
import { PageHeader } from "@/components/care/page-header";
import { MetricCard } from "@/components/care/metric-card";
import { Panel } from "@/components/care/panel";
import { EmptyState } from "@/components/care/empty-state";
import { TableSkeleton } from "@/components/care/loading";
import { Chip, PriorityChip } from "@/components/care/chips";
import { VitalsRow } from "@/components/care/vitals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePatients, useConsultations, useReferrals, queryKeys } from "@/hooks/use-care-data";
import { updateReferralStatus, REFERRAL_STATUSES, type Referral, type ReferralStatus } from "@/data/referrals";
import type { Patient } from "@/data/types";
import { relativeTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/app/referrals")({
  beforeLoad: () => requireRole(["doctor", "admin"]),
  head: () => ({
    meta: [
      { title: "Referrals — CarePriority" },
      { name: "description", content: "Track every patient referred onward, their destination and referral status." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReferralsPage,
});

const selectClass =
  "h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const statusChip: Record<ReferralStatus, string> = {
  pending: "border-warning/35 bg-warning-soft text-warning-foreground",
  referred: "border-primary/30 bg-primary-light text-primary-hover",
  completed: "border-success/30 bg-success-soft text-success",
};

function label(value: string) {
  return value ? value[0].toUpperCase() + value.slice(1) : "—";
}

function ReferralsPage() {
  const queryClient = useQueryClient();
  const { data: referrals = [], isLoading } = useReferrals();
  const { data: patients = [] } = usePatients();
  const { data: consultations = [] } = useConsultations();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | ReferralStatus>("all");
  const [doctor, setDoctor] = useState("all");
  const [sort, setSort] = useState<"recent" | "oldest">("recent");
  const [openId, setOpenId] = useState<string | null>(null);

  const patientById = useMemo(() => new Map(patients.map((p) => [p.id, p] as const)), [patients]);

  const doctors = useMemo(
    () => Array.from(new Set(referrals.map((r) => r.doctor_name).filter(Boolean))).sort(),
    [referrals],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return referrals
      .map((referral) => ({ referral, patient: patientById.get(referral.patient_id) }))
      .filter((r): r is { referral: Referral; patient: Patient } => !!r.patient)
      .filter(
        (r) =>
          !q ||
          r.patient.full_name.toLowerCase().includes(q) ||
          r.patient.patient_code.toLowerCase().includes(q) ||
          (r.patient.rfid_tag ?? "").toLowerCase().includes(q),
      )
      .filter((r) => status === "all" || r.referral.status === status)
      .filter((r) => doctor === "all" || r.referral.doctor_name === doctor)
      .sort((a, b) => {
        const at = new Date(a.referral.referred_at).getTime();
        const bt = new Date(b.referral.referred_at).getTime();
        return sort === "recent" ? bt - at : at - bt;
      });
  }, [referrals, patientById, query, status, doctor, sort]);

  const open = rows.find((r) => r.referral.id === openId) ?? null;
  const openConsultation = open
    ? consultations.find((c) => c.id === open.referral.consultation_id) ?? null
    : null;

  const setStatusMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: ReferralStatus }) => updateReferralStatus(id, next),
    onSuccess: () => {
      toast.success("Referral status updated");
      void queryClient.invalidateQueries({ queryKey: queryKeys.referrals });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const count = (s: ReferralStatus) => referrals.filter((r) => r.status === s).length;

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Console", to: "/app/doctor" }, { label: "Referrals" }]}
        title="Referrals"
        description="Every patient referred onward, with their destination, reason and current referral status."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total referrals" value={referrals.length} icon={Send} tone="primary" loading={isLoading} />
        <MetricCard label="Pending" value={count("pending")} icon={Send} tone="warning" loading={isLoading} />
        <MetricCard label="Referred" value={count("referred")} icon={Send} tone="primary" loading={isLoading} />
        <MetricCard label="Completed" value={count("completed")} icon={Send} tone="success" loading={isLoading} />
      </div>

      <Panel
        className="mt-6"
        title="Referral records"
        description={`${rows.length} record${rows.length === 1 ? "" : "s"}`}
        bodyClassName="space-y-4"
      >
        <div className="grid gap-3 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search name, patient ID or RFID"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search referrals"
            />
          </div>
          <select
            className={selectClass}
            value={status}
            onChange={(e) => setStatus(e.target.value as "all" | ReferralStatus)}
            aria-label="Filter by referral status"
          >
            <option value="all">All statuses</option>
            {REFERRAL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={doctor}
            onChange={(e) => setDoctor(e.target.value)}
            aria-label="Filter by referring doctor"
          >
            <option value="all">All doctors</option>
            {doctors.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={sort}
            onChange={(e) => setSort(e.target.value as "recent" | "oldest")}
            aria-label="Sort referrals"
          >
            <option value="recent">Sort: newest first</option>
            <option value="oldest">Sort: oldest first</option>
          </select>
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Send}
            title="No referrals yet"
            description="Referral records appear here when a doctor completes a consultation with the Referred outcome."
          />
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2">
            {rows.map(({ referral, patient }) => (
              <li key={referral.id}>
                <button
                  type="button"
                  onClick={() => setOpenId((cur) => (cur === referral.id ? null : referral.id))}
                  className="w-full rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-primary/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{patient.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {patient.patient_code}
                        {patient.rfid_tag ? ` · ${patient.rfid_tag}` : ""} · {patient.age}
                        {patient.gender}
                      </p>
                    </div>
                    <Chip className={statusChip[referral.status]}>{label(referral.status)}</Chip>
                  </div>
                  <p className="mt-2 break-words text-sm text-foreground">
                    {referral.destination || "Destination not recorded"}
                  </p>
                  <p className="mt-1 break-words text-xs text-muted-foreground">
                    {referral.reason || "No reason recorded"}
                  </p>
                  <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{referral.doctor_name || "Unknown doctor"}</span>
                    <span>{relativeTime(referral.referred_at)}</span>
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {open && (
        <Panel
          className="mt-6"
          title={`${open.patient.full_name} — referral detail`}
          description="Clinical record is read-only; only the referral status can be updated."
          actions={
            <Button size="sm" variant="ghost" onClick={() => setOpenId(null)} aria-label="Close referral detail">
              <X className="h-4 w-4" /> Close
            </Button>
          }
          bodyClassName="space-y-5"
        >
          <div className="flex flex-wrap items-center gap-2">
            <PriorityChip priority={open.patient.priority} />
            <Chip className={statusChip[open.referral.status]}>{label(open.referral.status)}</Chip>
            <span className="text-xs text-muted-foreground">
              Triage score {open.patient.triage_score} · {open.patient.age}
              {open.patient.gender}
              {open.patient.rfid_tag ? ` · ${open.patient.rfid_tag}` : ""}
            </span>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <Detail label="Patient ID" value={open.patient.patient_code} />
            <Detail label="Referring doctor" value={open.referral.doctor_name || "—"} />
            <Detail label="Referred at" value={new Date(open.referral.referred_at).toLocaleString()} />
            <Detail label="Destination" value={open.referral.destination || "Not recorded"} />
            <Detail label="Symptoms" value={open.patient.symptoms || "Not recorded"} />
            <Detail
              label="Diagnosis"
              value={open.referral.diagnosis || openConsultation?.diagnosis || "Not recorded"}
            />
            <Detail
              label="Clinical notes"
              value={open.referral.notes || openConsultation?.notes || "No notes recorded"}
            />
            <Detail label="Reason for referral" value={open.referral.reason || "Not recorded"} />
          </dl>

          <div className="rounded-xl border border-border p-3">
            <VitalsRow
              temperature={open.patient.temperature}
              heartRate={open.patient.heart_rate}
              spo2={open.patient.spo2}
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Update status</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {REFERRAL_STATUSES.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={open.referral.status === s ? "default" : "outline"}
                  disabled={setStatusMutation.isPending || open.referral.status === s}
                  onClick={() => setStatusMutation.mutate({ id: open.referral.id, next: s })}
                >
                  {setStatusMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {label(s)}
                </Button>
              ))}
            </div>
          </div>
        </Panel>
      )}
    </>
  );
}

function Detail({ label: name, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{name}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap break-words text-foreground">{value}</dd>
    </div>
  );
}
