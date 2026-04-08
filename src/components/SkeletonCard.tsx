export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`skeleton-shimmer p-5 space-y-3 ${className}`}>
      <div className="h-4 w-1/3 bg-muted-foreground/10 rounded" />
      <div className="h-3 w-2/3 bg-muted-foreground/10 rounded" />
      <div className="h-3 w-1/2 bg-muted-foreground/10 rounded" />
    </div>
  );
}

export function SkeletonRow({ className = "" }: { className?: string }) {
  return (
    <div className={`skeleton-shimmer h-20 ${className}`} />
  );
}