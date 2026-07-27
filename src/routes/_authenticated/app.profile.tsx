import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock3, Stethoscope } from "lucide-react";
import { PageHeader } from "@/components/care/page-header";
import { MetricCard } from "@/components/care/metric-card";
import { Panel } from "@/components/care/panel";
import { usePatients } from "@/hooks/use-care-data";
import { useSession, useProfile } from "@/hooks/use-session";
import { initials } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/app/profile")({
  head: () => ({
    meta: [
      { title: "Profile — CarePriority" },
      { name: "description", content: "Your clinical profile, role and activity summary." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useSession();
  const profile = useProfile(user?.id);
  const { data: patients = [], isLoading } = usePatients();
  const name = profile?.full_name || user?.email?.split("@")[0] || "Staff member";

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Console", to: "/app/reception" }, { label: "Profile" }]}
        title="Your profile"
        description="Details shown to colleagues across the CarePriority console."
      />

      <Panel>
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground">
            {initials(name)}
          </span>
          <div className="min-w-0">
            <p className="font-display text-xl font-semibold text-foreground">{name}</p>
            <p className="text-sm text-muted-foreground">
              {profile?.job_title || "Clinical staff"}
              {profile?.department ? ` · ${profile.department}` : ""}
            </p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </Panel>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <MetricCard label="Patients today" value={patients.length} icon={Stethoscope} loading={isLoading} />
        <MetricCard
          label="Completed"
          value={patients.filter((p) => p.status === "completed").length}
          icon={CheckCircle2}
          tone="success"
          loading={isLoading}
        />
        <MetricCard
          label="Currently waiting"
          value={patients.filter((p) => p.status === "waiting").length}
          icon={Clock3}
          tone="warning"
          loading={isLoading}
        />
      </div>
    </>
  );
}
