import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/care/page-header";
import { StatCard } from "@/components/care/stat-card";
import { commonSymptoms, patientFlow, priorityDist, weeklyTrend } from "@/lib/mock-data";
import { Activity, Clock, Timer, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Fragment, useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — CarePriority" }, { name: "robots", content: "noindex" }] }),
  component: Analytics,
});

const TABS = ["Daily", "Weekly", "Monthly", "Yearly"] as const;

function Analytics() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Weekly");
  return (
    <>
      <PageHeader eyebrow="Analytics" title="Clinic intelligence" description="Understand patient flow, priority mix, and symptom trends over any timeframe."
        actions={
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1 text-xs">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={cn("rounded-full px-4 py-1.5 transition", tab === t ? "bg-primary text-white" : "text-muted-foreground hover:text-white")}>{t}</button>
            ))}
          </div>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label={`Patients (${tab})`} value="284" icon={Users} accent="primary" delta={14} />
        <StatCard label="Avg wait" value="11m" icon={Timer} accent="warning" delta={-9} />
        <StatCard label="Critical served" value="46" icon={Activity} accent="success" delta={31} />
        <StatCard label="Peak load" value="15:00" icon={Clock} accent="primary" />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <div className="mb-4">
            <h3 className="font-display text-lg font-semibold">Patient flow</h3>
            <p className="text-xs text-muted-foreground">Intake volume by hour</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={patientFlow}>
                <defs>
                  <linearGradient id="flow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF1A1A" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#FF1A1A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="hour" stroke="#A0A0A0" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#A0A0A0" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #ffffff20", borderRadius: 12 }} />
                <Area type="monotone" dataKey="patients" stroke="#FF1A1A" fill="url(#flow)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass rounded-3xl p-6">
          <h3 className="font-display text-lg font-semibold">Priority distribution</h3>
          <p className="text-xs text-muted-foreground">Share by triage lane</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={priorityDist} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={3}>
                  {priorityDist.map((e) => <Cell key={e.name} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #ffffff20", borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5 text-sm">
            {priorityDist.map((p) => (
              <div key={p.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ background: p.color }} /> {p.name}
                </span>
                <span>{p.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="glass rounded-3xl p-6">
          <h3 className="font-display text-lg font-semibold">Common symptoms</h3>
          <p className="text-xs text-muted-foreground">Top complaints this {tab.toLowerCase()}</p>
          <div className="h-64 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={commonSymptoms} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid stroke="#ffffff10" horizontal={false} />
                <XAxis type="number" stroke="#A0A0A0" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis dataKey="symptom" type="category" stroke="#A0A0A0" fontSize={11} tickLine={false} axisLine={false} width={100} />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #ffffff20", borderRadius: 12 }} />
                <Bar dataKey="count" fill="#FF1A1A" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass rounded-3xl p-6">
          <h3 className="font-display text-lg font-semibold">Weekly triage mix</h3>
          <p className="text-xs text-muted-foreground">HIGH / MODERATE / LOW by day</p>
          <div className="h-64 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrend}>
                <CartesianGrid stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="day" stroke="#A0A0A0" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#A0A0A0" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #ffffff20", borderRadius: 12 }} />
                <Bar dataKey="high" stackId="a" fill="#FF1A1A" />
                <Bar dataKey="mod" stackId="a" fill="#FACC15" />
                <Bar dataKey="low" stackId="a" fill="#22C55E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="mt-6 glass rounded-3xl p-6">
        <h3 className="font-display text-lg font-semibold">Load heatmap</h3>
        <p className="text-xs text-muted-foreground">Patient intake density by hour and day</p>
        <Heatmap />
      </div>
    </>
  );
}

function Heatmap() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hours = Array.from({ length: 12 }, (_, i) => 7 + i);
  return (
    <div className="mt-4 overflow-x-auto">
      <div className="min-w-[600px]">
        <div className="grid grid-cols-[60px_repeat(12,minmax(0,1fr))] gap-1">
          <div />
          {hours.map((h) => <div key={h} className="text-center text-[10px] text-muted-foreground">{h}:00</div>)}
          {days.map((d, di) => (
            <Fragment key={d}>
              <div className="flex items-center text-xs text-muted-foreground">{d}</div>
              {hours.map((h, hi) => {
                const v = Math.abs(Math.sin(di + hi * 0.7)) * 0.9 + 0.1;
                return <div key={`${d}-${h}`} className="h-8 rounded-md" style={{ background: `oklch(0.63 0.245 27 / ${v.toFixed(2)})` }} />;
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}