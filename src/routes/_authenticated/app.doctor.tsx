import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/care/page-header";
import { StatCard } from "@/components/care/stat-card";
import { PriorityBadge } from "@/components/care/priority-badge";
import { mockPatients, type Patient } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ClipboardList, FileText, Heart, PlayCircle, Radio, Stethoscope, Thermometer, Timer, Wind } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/doctor")({
  head: () => ({ meta: [{ title: "Doctor — CarePriority" }, { name: "robots", content: "noindex" }] }),
  component: Doctor,
});

function Doctor() {
  const waiting = mockPatients.filter((p) => p.status !== "completed").sort((a, b) => {
    const o = { HIGH: 0, MODERATE: 1, LOW: 2 } as const;
    return o[a.priority] - o[b.priority] || a.queuePosition - b.queuePosition;
  });
  const [selected, setSelected] = useState<Patient>(waiting[0]);
  const [scanning, setScanning] = useState(false);
  const [inConsult, setInConsult] = useState(selected.status === "in-consult");

  function scan() { setScanning(true); setTimeout(() => setScanning(false), 900); }

  return (
    <>
      <PageHeader eyebrow="Doctor" title="Consultation console"
        description="Scan an RFID band to pull the full clinical context — vitals, transcript, history — in one screen."
        actions={
          <Button onClick={scan} className="bg-primary text-white hover:bg-primary/90">
            <Radio className={cn("mr-2 h-4 w-4", scanning && "animate-pulse")} /> {scanning ? "Scanning…" : "Scan RFID"}
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Next in queue" value={String(waiting.length)} icon={ClipboardList} accent="primary" />
        <StatCard label="Avg consult" value="7.2m" icon={Timer} accent="warning" delta={-11} />
        <StatCard label="Completed today" value="18" icon={CheckCircle2} accent="success" delta={24} />
        <StatCard label="Handoffs" value="2" icon={Stethoscope} accent="primary" />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="glass rounded-3xl p-4 lg:col-span-1">
          <div className="mb-3 px-2 text-xs uppercase tracking-widest text-muted-foreground">Up next</div>
          <div className="space-y-2">
            {waiting.map((p) => (
              <button key={p.id} onClick={() => { setSelected(p); setInConsult(p.status === "in-consult"); }} className={cn(
                "w-full rounded-2xl border p-3 text-left transition",
                selected.id === p.id ? "border-primary/40 bg-primary/10" : "border-white/5 bg-white/[0.02] hover:border-white/15",
              )}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{p.name}</p>
                  <PriorityBadge priority={p.priority} />
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">{p.symptoms}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="glass rounded-3xl p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-lg font-semibold text-white">
                  {selected.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <h3 className="font-display text-2xl font-semibold">{selected.name}</h3>
                  <p className="text-sm text-muted-foreground">{selected.id} · {selected.age} yrs · {selected.gender} · RFID <span className="font-mono">{selected.rfid}</span></p>
                  <div className="mt-2 flex items-center gap-2">
                    <PriorityBadge priority={selected.priority} />
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-muted-foreground">Queue #{selected.queuePosition}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {!inConsult ? (
                  <Button onClick={() => setInConsult(true)} className="bg-primary text-white hover:bg-primary/90"><PlayCircle className="mr-2 h-4 w-4" /> Start consultation</Button>
                ) : (
                  <Button onClick={() => setInConsult(false)} className="bg-success text-black hover:bg-success/90"><CheckCircle2 className="mr-2 h-4 w-4" /> Finish consultation</Button>
                )}
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <VitalTile icon={Thermometer} label="Temperature" value={`${selected.temperature}°C`} tone={selected.temperature > 38.5 ? "danger" : "muted"} />
              <VitalTile icon={Heart} label="Heart rate" value={`${selected.heartRate} bpm`} tone={selected.heartRate > 110 ? "danger" : "muted"} />
              <VitalTile icon={Wind} label="SpO₂" value={`${selected.spo2}%`} tone={selected.spo2 < 94 ? "danger" : "muted"} />
            </div>
          </div>
          <div className="glass rounded-3xl p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium"><FileText className="h-4 w-4 text-primary" /> Symptom transcript</div>
            <p className="rounded-2xl border border-white/5 bg-black/20 p-4 text-sm leading-relaxed">{selected.symptoms}</p>
          </div>
          <div className="glass rounded-3xl p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium"><ClipboardList className="h-4 w-4 text-primary" /> Medical history</div>
            <ul className="space-y-2 text-sm">
              {(selected.history || ["No prior records"]).map((h) => (
                <li key={h} className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" /> {h}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

function VitalTile({ icon: Icon, label, value, tone }: { icon: typeof Heart; label: string; value: string; tone: "muted" | "danger" }) {
  return (
    <div className={cn("rounded-2xl border p-4", tone === "danger" ? "border-primary/30 bg-primary/10" : "border-white/5 bg-white/[0.02]")}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <Icon className={cn("h-3.5 w-3.5", tone === "danger" ? "text-primary" : "text-muted-foreground")} />
        {label}
      </div>
      <p className={cn("mt-2 font-display text-2xl font-semibold", tone === "danger" && "text-primary")}>{value}</p>
    </div>
  );
}