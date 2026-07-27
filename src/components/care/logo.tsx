import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ to = "/", compact = false }: { to?: string; compact?: boolean }) {
  return (
    <Link to={to} className="group inline-flex items-center gap-2.5" aria-label="CarePriority home">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-xs">
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" aria-hidden="true">
          <path
            d="M2.5 12.5h4l2-5 3.5 9 2.5-6 1.7 3.5h5.3"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {!compact && (
        <span className={cn("text-[15px] font-semibold tracking-tight text-foreground")}>
          Care<span className="text-primary">Priority</span>
        </span>
      )}
    </Link>
  );
}
