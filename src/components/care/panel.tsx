import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PanelProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  descriptionClassName?: string;
  /** Removes body padding — useful for tables. */
  flush?: boolean;
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  headerClassName,
  descriptionClassName,
  flush,
}: PanelProps) {
  return (
    <section className={cn("panel rounded-2xl", className)}>
      {(title || actions) && (
        <header
          className={cn(
            "flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4",
            headerClassName,
          )}
        >
          <div className="min-w-0">
            {title && <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>}
            {description && (
              <p className={cn("mt-0.5 text-sm text-muted-foreground", descriptionClassName)}>{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn(flush ? "" : "p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

