import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border" role="status" aria-label="Loading records">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3.5">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="ml-auto h-3.5 w-24" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function CardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-3" role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  );
}
