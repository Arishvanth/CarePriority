import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/care/page-header";
import { StatCard } from "@/components/care/stat-card";
import { PriorityBadge } from "@/components/care/priority-badge";
import { mockPatients, priorityStyles, type Patient, type Priority } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle, Ambulance, ArrowUp, Heart, MapPin, Mic, Radio, Search, Siren, Thermometer, Timer, Users, Wind,
} from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/reception")({
  head: () => ({ meta: [{ title: "Reception — CarePriority" }, { name: "robots", content: "noindex" }] }),
  component: Reception,
});

function Reception() {
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [search, setSearch] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [emergency, setEmergency] = useState<Patient | null>(null);

  const overflow = patients.filter((p) => p.status === "waiting").length > 8;

  const grouped = useMemo(() => {
    const g: Record<Priority, Patient[]> = { HIGH: [], MODERATE: [], LOW: [] };
    patients.filter((p) => p.status !== "completed").forEach((p) => g[p.priority].push(p));
    (Object.keys(g) as Priority[]).forEach((k) => g[k].sort((a, b) => a.queuePosition - b.queuePosition));
    return g;
  }, [patients]);

  const filtered = patients.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.id.includes(search) || p.rfid.includes(search),
  );

  function promote(id: string) {
    setPatients((prev) => {
      const target = prev.find((p) => p.id === id);
      if (!target) return prev;
      return prev.map((p) => {
        if (p.id === id) return { ...p, priority: "HIGH", queuePosition: 0 };
        if (p.priority === "HIGH") return { ...p, queuePosition: p.queuePosition + 1 };
        return p;
      });
    });
    setEmergency(null);
  }

  return (
    <>
      <PageHeader
        eyebrow="Reception"
        title="Live intake & queue"
        description="Register patients, capture vitals, and watch the queue prioritize itself in real time."
        actions={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, ID, RFID…" className="h-10 w-64 bg-white/5 pl-9" />
            </div>
            <Button variant="outline" className="border-primary/40 bg-primary/10 text-primary hover:bg-primary/20">
              <Siren className="mr-2 h-4 w-4" /> Emergency
            </Button>
          </>
        }
      />

      {overflow && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-warning">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-warning">Overflow detected — {patients.filter((p) => p.status === "waiting").length} patients waiting.</p>
            <p className="text-xs text-warning/80">Consider re-routing low-priority patients to nearby facilities.</p>
          </div>
          <Button size="sm" variant="outline" className="border-warning/40 bg-warning/10 text-warning hover:bg-warning/20"><MapPin className="mr-1.5 h-3.5 w-3.5" /> Nearby hospitals</Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="High priority" value={String(grouped.HIGH.length)} icon={Ambulance} accent="primary" delta={12} />
        <StatCard label="In queue" value={String(patients.filter((p) => p.status === "waiting").length)} icon={Users} accent="warning" delta={5} />
        <StatCard label="Avg wait" value="9m" icon={Timer} accent="success" delta={-8} />
        <StatCard label="Completed today" value="47" icon={Heart} accent="success" delta={22} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-5">
        <RegisterPanel
          className="xl:col-span-2"
          recording={recording}
          transcript={transcript}
          onRecord={() => {
            setRecording(true);
            setTranscript("");
            setTimeout(() => {
              setTranscript("Patient reports chest tightness for the last 30 minutes, mild shortness of breath, no prior cardiac history.");
              setRecording(false);
            }, 1500);
          }}
        />
        <QueueLanes className="xl:col-span-3" grouped={grouped} onEmergency={setEmergency} />
      </div>

      <div className="mt-8 glass rounded-3xl">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <div>
            <h3 className="font-display text-lg font-semibold">All patients</h3>
            <p className="text-xs text-muted-foreground">Live view of everyone registered today.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr className="[&>th]:px-6 [&>th]:py-3">
                <th>Patient</th><th>Age</th><th>RFID</th><th>Vitals</th><th>Priority</th><th>Queue</th><th>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((p) => (
                <tr key={p.id} className="transition hover:bg-white/[0.02] [&>td]:px-6 [&>td]:py-3">
                  <td>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.id}</div>
                  </td>
                  <td className="text-muted-foreground">{p.age} · {p.gender}</td>
                  <td className="font-mono text-xs text-muted-foreground">{p.rfid}</td>
                  <td>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Thermometer className="h-3 w-3" /> {p.temperature}°</span>
                      <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" /> {p.heartRate}</span>
                      <span className="inline-flex items-center gap-1"><Wind className="h-3 w-3" /> {p.spo2}%</span>
                    </div>
                  </td>
                  <td><PriorityBadge priority={p.priority} /></td>
                  <td className="text-muted-foreground">#{p.queuePosition}</td>
                  <td>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs",
                      p.status === "waiting" ? "bg-white/5 text-muted-foreground" :
                      p.status === "in-consult" ? "bg-warning/15 text-warning" : "bg-success/15 text-success")}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {emergency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass w-full max-w-md rounded-3xl p-6 glow-red">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary"><Siren className="h-5 w-5" /></div>
              <div>
                <h3 className="font-display text-lg font-semibold">Emergency override</h3>
                <p className="text-sm text-muted-foreground">Move <span className="text-white">{emergency.name}</span> to the top of the queue?</p>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-muted-foreground">{emergency.symptoms}</div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEmergency(null)}>Cancel</Button>
              <Button className="bg-primary text-white hover:bg-primary/90" onClick={() => promote(emergency.id)}>
                <ArrowUp className="mr-1.5 h-4 w-4" /> Promote now
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function RegisterPanel({ className, recording, transcript, onRecord }: { className?: string; recording: boolean; transcript: string; onRecord: () => void }) {
  return (
    <div className={cn("glass rounded-3xl p-6", className)}>
      <h3 className="font-display text-lg font-semibold">Register patient</h3>
      <p className="text-xs text-muted-foreground">All fields feed the AI triage engine.</p>
      <div className="mt-5 grid gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2 grid gap-1.5"><Label className="text-xs">Full name</Label><Input placeholder="e.g. Aarav Sharma" className="bg-white/5" /></div>
          <div className="grid gap-1.5"><Label className="text-xs">Age</Label><Input placeholder="34" className="bg-white/5" /></div>
        </div>
        <div className="grid gap-1.5"><Label className="text-xs">Gender</Label>
          <div className="flex gap-2">
            {["Female", "Male", "Other"].map((g) => (
              <button key={g} className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 text-sm transition hover:border-primary/40">{g}</button>
            ))}
          </div>
        </div>

        <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Voice symptoms</Label>
            <button onClick={onRecord} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition",
              recording ? "bg-primary/20 text-primary animate-pulse-ring" : "border border-white/10 text-muted-foreground hover:text-white")}>
              <Mic className="h-3.5 w-3.5" /> {recording ? "Listening…" : "Record"}
            </button>
          </div>
          <div className="min-h-16 rounded-lg border border-white/5 bg-black/20 p-3 text-sm">
            {transcript || <span className="text-muted-foreground">Transcript will appear here…</span>}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <VitalInput icon={Thermometer} label="Temp °C" value="37.4" />
          <VitalInput icon={Heart} label="HR bpm" value="88" />
          <VitalInput icon={Wind} label="SpO₂ %" value="98" />
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs">RFID wristband</Label>
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2">
            <Radio className="h-4 w-4 text-primary" />
            <span className="font-mono text-sm">RF-88D1</span>
            <button className="ml-auto rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-white/5 hover:text-white">Re-scan</button>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 p-4">
          <div>
            <p className="text-xs text-muted-foreground">Auto-assigned priority</p>
            <p className="mt-0.5 font-display text-lg font-semibold text-primary">HIGH · Queue #4</p>
          </div>
          <Button className="bg-primary text-white hover:bg-primary/90">Add to queue</Button>
        </div>
      </div>
    </div>
  );
}

function VitalInput({ icon: Icon, label, value }: { icon: typeof Heart; label: string; value: string }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
        <Icon className="h-4 w-4 text-primary" />
        <input defaultValue={value} className="w-full bg-transparent text-sm outline-none" />
      </div>
    </div>
  );
}

function QueueLanes({ className, grouped, onEmergency }: { className?: string; grouped: Record<Priority, Patient[]>; onEmergency: (p: Patient) => void }) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-3", className)}>
      {(Object.keys(grouped) as Priority[]).map((k) => (
        <div key={k} className="glass rounded-3xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn("h-2 w-2 rounded-full", priorityStyles[k].dot)} />
              <h3 className="font-display font-semibold">{priorityStyles[k].label}</h3>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">{grouped[k].length}</span>
            </div>
          </div>
          <div className="space-y-2">
            {grouped[k].map((p) => (
              <div key={p.id} className="group rounded-2xl border border-white/5 bg-white/[0.02] p-3 transition hover:border-primary/30">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.symptoms}</p>
                  </div>
                  <span className="rounded-lg bg-white/5 px-2 py-0.5 text-[11px] text-muted-foreground">#{p.queuePosition}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{p.temperature}° · {p.heartRate}bpm · {p.spo2}%</span>
                  {k !== "HIGH" && (
                    <button onClick={() => onEmergency(p)} className="opacity-0 transition group-hover:opacity-100 text-primary hover:underline">Emergency ↑</button>
                  )}
                </div>
              </div>
            ))}
            {grouped[k].length === 0 && <p className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-xs text-muted-foreground">Empty lane</p>}
          </div>
        </div>
      ))}
    </div>
  );
}