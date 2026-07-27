import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/care/page-header";
import { StatCard } from "@/components/care/stat-card";
import { Award, CheckCircle2, Clock, Stethoscope } from "lucide-react";

export const Route = createFileRoute("/app/profile")({
  head: () => ({ meta: [{ title: "Profile — CarePriority" }, { name: "robots", content: "noindex" }] }),
  component: Profile,
});

function Profile() {
  return (
    <>
      <PageHeader eyebrow="Profile" title="Your account" description="A quick snapshot of your activity on CarePriority." />
      <div className="glass rounded-3xl p-8">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-secondary text-2xl font-semibold text-white">RM</div>
          <div>
            <h3 className="font-display text-2xl font-semibold">Dr. Rhea Menon</h3>
            <p className="text-sm text-muted-foreground">Chief Physician · Sunrise Community Clinic</p>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-primary">MBBS, MD</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-muted-foreground">MCI Reg. 4438201</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Patients this month" value="1,284" icon={Stethoscope} accent="primary" delta={11} />
        <StatCard label="Avg consult time" value="7.8m" icon={Clock} accent="warning" delta={-6} />
        <StatCard label="Successful triage" value="98%" icon={CheckCircle2} accent="success" delta={2} />
        <StatCard label="Awards" value="3" icon={Award} accent="primary" />
      </div>
    </>
  );
}