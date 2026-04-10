export default function AppLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <div className="h-7 w-44 animate-pulse rounded-md bg-muted" />
      <div className="h-10 animate-pulse rounded-xl bg-muted/70" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-28 animate-pulse rounded-xl bg-muted/70" />
        <div className="h-28 animate-pulse rounded-xl bg-muted/70" />
        <div className="h-28 animate-pulse rounded-xl bg-muted/70" />
      </div>
    </div>
  );
}
