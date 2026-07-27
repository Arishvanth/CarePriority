import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/care/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/app/settings")({
  head: () => ({ meta: [{ title: "Settings — CarePriority" }, { name: "robots", content: "noindex" }] }),
  component: Settings,
});

function Settings() {
  return (
    <>
      <PageHeader eyebrow="Settings" title="Preferences" description="Personalize how the console behaves for you." />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass rounded-3xl p-6">
          <h3 className="font-display text-lg font-semibold">General</h3>
          <div className="mt-4 grid gap-3">
            <div className="grid gap-1.5"><Label className="text-xs">Display name</Label><Input defaultValue="Dr. Rhea Menon" className="bg-white/5" /></div>
            <div className="grid gap-1.5"><Label className="text-xs">Language</Label><Input defaultValue="English (India)" className="bg-white/5" /></div>
            <div className="grid gap-1.5"><Label className="text-xs">Timezone</Label><Input defaultValue="Asia / Kolkata" className="bg-white/5" /></div>
          </div>
        </div>
        <div className="glass rounded-3xl p-6">
          <h3 className="font-display text-lg font-semibold">Notifications</h3>
          <div className="mt-4 space-y-3">
            {["HIGH-priority intake", "Overflow alerts", "Consult reminders", "Weekly digest"].map((l) => (
              <div key={l} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <p className="text-sm">{l}</p>
                <Switch defaultChecked />
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <h3 className="font-display text-lg font-semibold">Security</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5"><Label className="text-xs">Current password</Label><Input type="password" defaultValue="********" className="bg-white/5" /></div>
            <div className="grid gap-1.5"><Label className="text-xs">New password</Label><Input type="password" className="bg-white/5" /></div>
          </div>
          <Button className="mt-4 bg-primary text-white hover:bg-primary/90">Update password</Button>
        </div>
      </div>
    </>
  );
}