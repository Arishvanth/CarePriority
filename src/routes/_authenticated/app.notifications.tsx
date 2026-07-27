import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { BellRing, Loader2, Mail, MessageSquare, Siren, TriangleAlert } from "lucide-react";

import { PageHeader } from "@/components/care/page-header";
import { Panel } from "@/components/care/panel";
import { MetricCard } from "@/components/care/metric-card";
import { AlertFeed } from "@/components/care/alert-feed";
import { TableSkeleton } from "@/components/care/loading";
import { Button } from "@/components/ui/button";
import { useAlerts, queryKeys } from "@/hooks/use-care-data";
import { acknowledgeAlert, dispatchExternalNotification } from "@/data/alerts";
import type { Alert } from "@/data/types";

export const Route = createFileRoute("/_authenticated/app/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — CarePriority" },
      { name: "description", content: "Emergency, overflow and triage alerts with email and SMS escalation." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotificationsPage,
});

type Filter = "all" | "unread" | "critical";

function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data: alerts = [], isLoading } = useAlerts();
  const [filter, setFilter] = useState<Filter>("all");

  const ack = useMutation({
    mutationFn: (alert: Alert) => acknowledgeAlert(alert.id),
    onSuccess: () => {
      toast.success("Alert acknowledged");
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const escalate = useMutation({
    mutationFn: async (channel: "email" | "sms") => {
      const pending = alerts.filter((a) => !a.acknowledged_at && a.severity === "critical");
      if (pending.length === 0) throw new Error("No unacknowledged critical alerts to escalate.");
      return dispatchExternalNotification({
        channel,
        to: channel === "email" ? "on-call@clinic.local" : "+10000000000",
        subject: `CarePriority: ${pending.length} critical alert(s)`,
        body: pending.map((a) => `${a.title} — ${a.message}`).join("\n"),
      });
    },
    onSuccess: (result, channel) => {
      if (result.delivered) toast.success(`Escalated by ${channel}`);
      else
        toast.warning(`${channel === "email" ? "Email" : "SMS"} provider not connected`, {
          description: "Connect a provider to deliver escalations outside the app.",
        });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const filtered = alerts.filter((a) =>
    filter === "unread" ? !a.acknowledged_at : filter === "critical" ? a.severity === "critical" : true,
  );

  const unread = alerts.filter((a) => !a.acknowledged_at).length;
  const critical = alerts.filter((a) => a.severity === "critical" && !a.acknowledged_at).length;
  const overflow = alerts.filter((a) => a.kind === "overflow").length;

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Console", to: "/app/reception" }, { label: "Notifications" }]}
        title="Alerts & escalation"
        description="Every emergency override, overflow warning and high-priority triage lands here in real time."
        actions={
          <>
            <Button variant="outline" onClick={() => escalate.mutate("email")} disabled={escalate.isPending}>
              {escalate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Escalate by email
            </Button>
            <Button variant="outline" onClick={() => escalate.mutate("sms")} disabled={escalate.isPending}>
              <MessageSquare className="h-4 w-4" /> Escalate by SMS
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Unacknowledged" value={unread} icon={BellRing} tone="warning" loading={isLoading} />
        <MetricCard label="Critical open" value={critical} icon={Siren} tone="danger" loading={isLoading} />
        <MetricCard label="Overflow warnings" value={overflow} icon={TriangleAlert} tone="primary" loading={isLoading} />
      </div>

      <Panel
        className="mt-6 lg:mt-8"
        title="Alert feed"
        description="Newest first. Acknowledge to clear from the unread count."
        actions={
          <div className="flex rounded-lg border border-border p-0.5" role="tablist" aria-label="Filter alerts">
            {(["all", "unread", "critical"] as Filter[]).map((option) => (
              <button
                key={option}
                role="tab"
                aria-selected={filter === option}
                onClick={() => setFilter(option)}
                className={
                  filter === option
                    ? "rounded-md bg-primary px-3 py-1 text-xs font-medium capitalize text-primary-foreground"
                    : "rounded-md px-3 py-1 text-xs capitalize text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                {option}
              </button>
            ))}
          </div>
        }
        flush
      >
        {isLoading ? <TableSkeleton /> : <AlertFeed alerts={filtered} onAcknowledge={(a) => ack.mutate(a)} />}
      </Panel>
    </>
  );
}
