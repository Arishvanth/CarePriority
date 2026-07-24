import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Logo } from "./logo";
import {
  Activity, BarChart3, Bell, LayoutDashboard, LogOut, Settings, ShieldCheck,
  Stethoscope, User, UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/app/reception", label: "Reception", icon: LayoutDashboard },
  { to: "/app/doctor", label: "Doctor", icon: Stethoscope },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/admin", label: "Admin", icon: ShieldCheck },
] as const;

const bottomNav = [
  { to: "/app/notifications", label: "Notifications", icon: Bell },
  { to: "/app/settings", label: "Settings", icon: Settings },
  { to: "/app/profile", label: "Profile", icon: User },
] as const;

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/5 bg-sidebar/60 px-4 py-5 backdrop-blur-xl lg:flex">
        <Logo to="/app/reception" />
        <div className="mt-8 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Workspace</div>
        <nav className="mt-2 flex flex-col gap-1">
          {nav.map((n) => {
            const active = pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                active ? "bg-primary/15 text-white ring-1 ring-primary/30" : "text-muted-foreground hover:bg-white/5 hover:text-white",
              )}>
                <n.icon className={cn("h-4 w-4", active && "text-primary")} />
                {n.label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />}
              </Link>
            );
          })}
        </nav>
        <div className="mt-8 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Account</div>
        <nav className="mt-2 flex flex-col gap-1">
          {bottomNav.map((n) => {
            const active = pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                active ? "bg-white/5 text-white" : "text-muted-foreground hover:bg-white/5 hover:text-white",
              )}>
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-semibold">DR</div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">Dr. Rhea Menon</p>
                <p className="truncate text-xs text-muted-foreground">Chief Physician</p>
              </div>
            </div>
            <Link to="/auth" className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-white/10 py-2 text-xs text-muted-foreground transition hover:bg-white/5 hover:text-white">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </Link>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-white/5 bg-background/70 px-4 backdrop-blur-xl lg:px-8">
          <div className="lg:hidden"><Logo to="/app/reception" /></div>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/app/notifications" className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-muted-foreground hover:bg-white/5 hover:text-white">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
            </Link>
            <Link to="/app/profile" className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-muted-foreground hover:bg-white/5 hover:text-white">
              <UserCog className="h-4 w-4" />
            </Link>
            <div className="ml-2 hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground sm:flex">
              <Activity className="h-3.5 w-3.5 text-success" /> System healthy
            </div>
          </div>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}