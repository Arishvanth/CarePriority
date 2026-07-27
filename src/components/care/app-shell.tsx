import { useState } from "react";
import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  BarChart3, Bell, LayoutDashboard, LogOut, Menu, Settings, ShieldCheck,
  Stethoscope, UserRound, X, CircleCheck,
} from "lucide-react";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAlerts, useCareRealtime } from "@/hooks/use-care-data";
import { useSession, useProfile } from "@/hooks/use-session";
import { initials } from "@/lib/format";
import { Button } from "@/components/ui/button";

const primaryNav = [
  { to: "/app/reception", label: "Reception", icon: LayoutDashboard },
  { to: "/app/doctor", label: "Doctor", icon: Stethoscope },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/admin", label: "Administration", icon: ShieldCheck },
] as const;

const accountNav = [
  { to: "/app/notifications", label: "Notifications", icon: Bell },
  { to: "/app/settings", label: "Settings", icon: Settings },
  { to: "/app/profile", label: "Profile", icon: UserRound },
] as const;

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useSession();
  const profile = useProfile(user?.id);
  useCareRealtime();
  const { data: alerts = [] } = useAlerts();
  const unread = alerts.filter((a) => !a.acknowledged_at).length;

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Staff member";
  const displayRole = profile?.job_title || "Clinical staff";

  const sidebar = (
    <div className="flex h-full flex-col px-3 py-4">
      <div className="px-2">
        <Logo to="/app/reception" />
      </div>

      <p className="mt-7 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Workspace
      </p>
      <nav className="mt-2 flex flex-col gap-0.5" aria-label="Main navigation">
        {primaryNav.map((item) => (
          <NavItem key={item.to} {...item} active={pathname.startsWith(item.to)} onNavigate={() => setMobileOpen(false)} />
        ))}
      </nav>

      <p className="mt-7 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Account
      </p>
      <nav className="mt-2 flex flex-col gap-0.5" aria-label="Account navigation">
        {accountNav.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            active={pathname.startsWith(item.to)}
            badge={item.to === "/app/notifications" && unread > 0 ? unread : undefined}
            onNavigate={() => setMobileOpen(false)}
          />
        ))}
      </nav>

      <div className="mt-auto rounded-xl border border-border bg-muted/50 p-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initials(displayName)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{displayRole}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="mt-2.5 w-full" onClick={signOut}>
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border bg-sidebar lg:block">
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-border bg-sidebar shadow-lift animate-rise">
            {sidebar}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur-xl lg:px-8">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <div className="lg:hidden">
            <Logo to="/app/reception" compact />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-success/25 bg-success-soft px-2.5 py-1 text-xs font-medium text-success sm:inline-flex">
              <CircleCheck className="h-3.5 w-3.5" /> Live sync active
            </span>
            <Link
              to="/app/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-danger-foreground">
                  {unread}
                </span>
              )}
            </Link>
            <Link
              to="/app/profile"
              className="flex h-9 items-center gap-2 rounded-lg border border-border px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                {initials(displayName)}
              </span>
              <span className="hidden max-w-28 truncate sm:inline">{displayName}</span>
            </Link>
          </div>
        </header>

        <main id="main" className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  active,
  badge,
  onNavigate,
}: {
  to: string;
  label: string;
  icon: typeof Bell;
  active: boolean;
  badge?: number;
  onNavigate?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className={cn("h-4 w-4", active && "text-primary")} aria-hidden="true" />
      {label}
      {badge !== undefined && (
        <span className="ml-auto rounded-full bg-danger px-1.5 text-[10px] font-semibold text-danger-foreground">
          {badge}
        </span>
      )}
    </Link>
  );
}
