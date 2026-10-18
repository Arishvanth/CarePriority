import { useQuery } from "@tanstack/react-query";
import { Panel } from "@/components/care/panel";
import { hardwareService } from "@/lib/hardware/service";
import type { DeviceStatus } from "@/lib/hardware/types";
import { cn } from "@/lib/utils";

const tone: Record<DeviceStatus, string> = {
  connected: "border-success/40 bg-success-soft text-success",
  simulated: "border-warning/40 bg-warning-soft text-foreground",
  disconnected: "border-border bg-muted text-muted-foreground",
};
const text: Record<DeviceStatus, string> = {
  connected: "Connected",
  simulated: "Demo / simulated",
  disconnected: "Disconnected",
};

/** Read-only diagnostics. Does not affect registration, vitals entry, or triage. */
export function HardwareStatus({ className }: { className?: string }) {
  const { data = [] } = useQuery({
    queryKey: ["hardware-status"],
    queryFn: () => hardwareService.getStatus(),
    staleTime: 30_000,
  });
  return (
    <Panel
      className={className}
      title="Hardware status"
      description="No physical devices are connected. Simulated readings are demo-only — enter vitals manually for clinical use."
    >
      <ul className="grid min-w-0 gap-2 [grid-template-columns:repeat(auto-fit,minmax(min(100%,12rem),1fr))]">
        {data.map((d) => (
          <li key={d.kind} className="min-w-0 rounded-xl border border-border p-3">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">{d.label}</span>
              <span className={cn("rounded-full border px-2 py-0.5 text-xs", tone[d.status])}>
                {text[d.status]}
              </span>
            </div>
            <p className="mt-1 break-words text-xs text-muted-foreground">{d.detail}</p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
