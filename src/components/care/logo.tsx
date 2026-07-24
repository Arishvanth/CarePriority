import { Activity } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function Logo({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="group flex items-center gap-2.5">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/30">
        <Activity className="h-4 w-4 text-white" strokeWidth={2.5} />
        <span className="absolute inset-0 rounded-xl ring-1 ring-white/20" />
      </span>
      <span className="text-[15px] font-semibold tracking-tight">
        Care<span className="text-primary">Priority</span>
      </span>
    </Link>
  );
}