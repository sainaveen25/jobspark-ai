export default function RootLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 p-6">
      <div className="h-8 w-56 animate-pulse rounded-md bg-muted" />
      <div className="h-24 animate-pulse rounded-xl bg-muted/70" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-40 animate-pulse rounded-xl bg-muted/70" />
        <div className="h-40 animate-pulse rounded-xl bg-muted/70" />
      </div>
    </div>
  );
}
