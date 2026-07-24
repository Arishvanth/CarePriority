import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/care/page-header";
import { AlertTriangle, Ambulance, Bell, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — CarePriority" }, { name: "robots", content: "noindex" }] }),
  component: Notifications,
});

const items = [
  { icon: Ambulance, tone: "primary", t: "HIGH-priority intake", d: "Aarav Sharma, chest pain, dyspnea. Queue #1.", at: "just now" },
  { icon: AlertTriangle, tone: "warning", t: "Overflow warning", d: "Waiting room load at 92% capacity.", at: "6 min ago" },
  { icon: CheckCircle2, tone: "success", t: "Consult completed", d: "Priya Verma — treatment plan filed.", at: "18 min ago" },
  { icon: Info, tone: "muted", t: "Threshold updated", d: "Admin lowered SpO₂ HIGH threshold to 93%.", at: "1 hr ago" },
  { icon: Bell, tone: "muted", t: "Nightly report ready", d: "Yesterday's clinic KPIs are available.", at: "8 hr ago" },
];

function Notifications() {
  const toneMap = { primary: "text-primary bg-primary/15", warning: "text-warning bg-warning/15", success: "text-success bg-success/15", muted: "text-muted-foreground bg-white/5" } as const;
  return (
    <>
      <PageHeader eyebrow="Notifications" title="Inbox" description="All the alerts your workspace has surfaced today." />
      <div className="glass divide-y divide-white/5 rounded-3xl">
        {items.map((i) => (
          <div key={i.t} className="flex items-start gap-4 p-5">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", toneMap[i.tone as keyof typeof toneMap])}>
              <i.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{i.t}</p>
              <p className="text-xs text-muted-foreground">{i.d}</p>
            </div>
            <span className="text-xs text-muted-foreground">{i.at}</span>
          </div>
        ))}
      </div>
    </>
  );
}