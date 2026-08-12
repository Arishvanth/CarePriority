import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/rbac";
import { PageHeader } from "@/components/care/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, ShieldCheck, Stethoscope, Trash2, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/admin")({
  beforeLoad: () => requireRole(["admin"]),
  head: () => ({ meta: [{ title: "Admin — CarePriority" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

const users = [
  { name: "Dr. Rhea Menon", role: "Doctor", email: "rhea@clinic.org", status: "active" },
  { name: "Dr. Vikram Iyer", role: "Doctor", email: "vikram@clinic.org", status: "active" },
  { name: "Priya Nair", role: "Receptionist", email: "priya@clinic.org", status: "active" },
  { name: "Kunal Shah", role: "Receptionist", email: "kunal@clinic.org", status: "invited" },
  { name: "Anita Rao", role: "Admin", email: "anita@clinic.org", status: "active" },
];

function Admin() {
  return (
    <>
      <PageHeader breadcrumbs={[{ label: "Console", to: "/app/reception" }]} title="Workspace settings" description="Manage staff, thresholds, and hospital-wide configuration."
        actions={<Button className="bg-primary text-white hover:bg-primary/90"><Plus className="mr-2 h-4 w-4" /> Invite user</Button>} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <div className="mb-4">
            <h3 className="font-display text-lg font-semibold">Team</h3>
            <p className="text-xs text-muted-foreground">Reception, doctors, and admins.</p>
          </div>
          <div className="divide-y divide-white/5">
            {users.map((u) => (
              <div key={u.email} className="flex items-center gap-3 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-semibold text-white">
                  {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{u.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
                <span className="hidden rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-muted-foreground sm:inline">
                  {u.role === "Doctor" ? <Stethoscope className="mr-1 inline h-3 w-3" /> : u.role === "Admin" ? <ShieldCheck className="mr-1 inline h-3 w-3" /> : <User className="mr-1 inline h-3 w-3" />}
                  {u.role}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${u.status === "active" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>{u.status}</span>
                <button className="ml-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-3xl p-6">
          <h3 className="font-display text-lg font-semibold">Hospital</h3>
          <p className="text-xs text-muted-foreground">Basic clinic profile</p>
          <div className="mt-4 grid gap-3">
            <div className="grid gap-1.5"><Label className="text-xs">Name</Label><Input defaultValue="Sunrise Community Clinic" className="bg-white/5" /></div>
            <div className="grid gap-1.5"><Label className="text-xs">Location</Label><Input defaultValue="Nashik, Maharashtra" className="bg-white/5" /></div>
            <div className="grid gap-1.5"><Label className="text-xs">Beds</Label><Input defaultValue="48" className="bg-white/5" /></div>
            <Button className="mt-2 bg-primary text-white hover:bg-primary/90">Save changes</Button>
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="glass rounded-3xl p-6">
          <h3 className="font-display text-lg font-semibold">Triage thresholds</h3>
          <p className="text-xs text-muted-foreground">Tune the AI scoring engine for your population.</p>
          <div className="mt-4 space-y-4">
            {[
              { l: "SpO₂ HIGH threshold", d: "Below this triggers HIGH lane", v: "93%" },
              { l: "Temperature HIGH threshold", d: "Above this triggers HIGH lane", v: "39.0°C" },
              { l: "Heart rate HIGH threshold", d: "Above this triggers HIGH lane", v: "120 bpm" },
            ].map((t) => (
              <div key={t.l} className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <div className="flex-1">
                  <p className="text-sm font-medium">{t.l}</p>
                  <p className="text-xs text-muted-foreground">{t.d}</p>
                </div>
                <Input defaultValue={t.v} className="w-24 bg-white/5" />
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-3xl p-6">
          <h3 className="font-display text-lg font-semibold">System</h3>
          <p className="text-xs text-muted-foreground">Operational toggles</p>
          <div className="mt-4 space-y-3">
            {[
              { l: "Emergency SMS alerts", d: "Notify on-call doctor on HIGH intake", on: true },
              { l: "Overflow re-routing", d: "Suggest nearby hospitals when full", on: true },
              { l: "Offline edge mode", d: "Run inference on-prem if internet drops", on: true },
              { l: "Audit trail export", d: "Nightly signed export to encrypted storage", on: false },
            ].map((s) => (
              <div key={s.l} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <div>
                  <p className="text-sm font-medium">{s.l}</p>
                  <p className="text-xs text-muted-foreground">{s.d}</p>
                </div>
                <Switch defaultChecked={s.on} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}