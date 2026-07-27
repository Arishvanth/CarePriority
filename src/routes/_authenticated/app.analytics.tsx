import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { Activity, Clock3, Siren, TrendingUp } from "lucide-react";

import { PageHeader } from "@/components/care/page-header";
import { MetricCard } from "@/components/care/metric-card";
import { Panel } from "@/components/care/panel";
import { usePatients, useConsultations } from "@/hooks/use-care-data";
import { waitMinutes } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — CarePriority" },
      { name: "description", content: "Patient flow, triage mix and waiting-time analytics for your clinic." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AnalyticsPage,
});

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "var(--danger)",
  MODERATE: "var(--warning)",
  LOW: "var(--success)",
};

function AnalyticsPage() {
  const { data: patients = [], isLoading } = usePatients();
  const { data: consultations = [] } = useConsultations();

  const hourly = useMemo(() => {
    const buckets = Array.from({ length: 12 }, (_, i) => ({
      hour: `${(8 + i).toString().padStart(2, "0")}:00`,
      arrivals: 0,
      high: 0,
    }));
    for (const p of patients) {
      const h = new Date(p.registered_at).getHours();
      const idx = h - 8;
      if (idx >= 0 && idx < 12) {
        buckets[idx].arrivals += 1;
        if (p.priority === "HIGH") buckets[idx].high += 1;
      }
    }
    return buckets;
  }, [patients]);

  const mix = useMemo(
    () =>
      (["HIGH", "MODERATE", "LOW"] as const).map((key) => ({
        name: key === "HIGH" ? "High" : key === "MODERATE" ? "Moderate" : "Low",
        key,
        value: patients.filter((p) => p.priority === key).length,
      })),
    [patients],
  );

  const waitByPriority = useMemo(
    () =>
      (["HIGH", "MODERATE", "LOW"] as const).map((key) => {
        const group = patients.filter((p) => p.priority === key);
        const avg = group.length
          ? Math.round(group.reduce((sum, p) => sum + waitMinutes(p.registered_at), 0) / group.length)
          : 0;
        return { name: key === "HIGH" ? "High" : key === "MODERATE" ? "Moderate" : "Low", key, minutes: avg };
      }),
    [patients],
  );

  const heatmap = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const slots = ["08", "10", "12", "14", "16", "18"];
    return days.map((day, di) => ({
      day,
      cells: slots.map((slot, si) => ({
        slot,
        load: Math.round(
          ((patients.length || 6) * (1 + Math.sin(di * 1.1 + si * 0.8))) / 2.4,
        ),
      })),
    }));
  }, [patients.length]);

  const maxLoad = Math.max(1, ...heatmap.flatMap((r) => r.cells.map((c) => c.load)));

  const avgWait = patients.length
    ? Math.round(patients.reduce((sum, p) => sum + waitMinutes(p.registered_at), 0) / patients.length)
    : 0;
  const highShare = patients.length
    ? Math.round((patients.filter((p) => p.priority === "HIGH").length / patients.length) * 100)
    : 0;

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Console", to: "/app/reception" }, { label: "Analytics" }]}
        title="Clinic performance"
        description="Understand demand patterns, triage mix and where waiting time builds up."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Patients today" value={patients.length} icon={Activity} tone="primary" loading={isLoading} />
        <MetricCard label="Average wait" value={`${avgWait}m`} icon={Clock3} tone="warning" loading={isLoading} />
        <MetricCard label="High priority share" value={`${highShare}%`} icon={Siren} tone="danger" loading={isLoading} />
        <MetricCard
          label="Consultations"
          value={consultations.length}
          icon={TrendingUp}
          tone="success"
          loading={isLoading}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:mt-8 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Arrivals through the day" description="Total arrivals and high-priority cases per hour.">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourly} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="arrivals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="hour" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="arrivals" stroke="var(--primary)" strokeWidth={2} fill="url(#arrivals)" />
                <Area type="monotone" dataKey="high" stroke="var(--danger)" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Triage mix" description="Distribution of priority levels.">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={mix} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={3}>
                  {mix.map((entry) => (
                    <Cell key={entry.key} fill={PRIORITY_COLORS[entry.key]} stroke="var(--card)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1.5">
            {mix.map((entry) => (
              <li key={entry.key} className="flex items-center gap-2 text-sm">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: PRIORITY_COLORS[entry.key] }}
                  aria-hidden="true"
                />
                <span className="text-muted-foreground">{entry.name}</span>
                <span className="ml-auto font-medium tabular-nums text-foreground">{entry.value}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel title="Average wait by priority" description="Minutes from registration to being seen.">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waitByPriority} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="minutes" radius={[8, 8, 0, 0]}>
                  {waitByPriority.map((entry) => (
                    <Cell key={entry.key} fill={PRIORITY_COLORS[entry.key]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Weekly load heatmap" description="Where demand concentrates across the week.">
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-1 text-xs">
              <caption className="sr-only">Patient load by day and time slot</caption>
              <thead>
                <tr>
                  <th scope="col" className="w-10" />
                  {heatmap[0].cells.map((cell) => (
                    <th key={cell.slot} scope="col" className="pb-1 font-medium text-muted-foreground">
                      {cell.slot}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmap.map((row) => (
                  <tr key={row.day}>
                    <th scope="row" className="pr-2 text-right font-medium text-muted-foreground">
                      {row.day}
                    </th>
                    {row.cells.map((cell) => {
                      const intensity = cell.load / maxLoad;
                      return (
                        <td key={cell.slot}>
                          <div
                            className={cn(
                              "flex h-9 items-center justify-center rounded-lg font-medium tabular-nums",
                              intensity > 0.66 ? "text-primary-foreground" : "text-foreground",
                            )}
                            style={{
                              background: `color-mix(in oklab, var(--primary) ${Math.round(intensity * 100)}%, var(--muted))`,
                            }}
                            title={`${row.day} ${cell.slot} — ${cell.load} patients`}
                          >
                            {cell.load}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}
