export default function KidLoading() {
  return (
    <main className="mx-auto max-w-2xl px-6 pb-8 pt-6">
      <div className="h-4 w-32 animate-pulse rounded bg-[var(--line)]" />
      <div className="mt-5 h-8 w-64 max-w-full animate-pulse rounded bg-[var(--line)]" />
      <div className="mt-6 flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-9 w-20 animate-pulse rounded-full bg-[var(--line)]"
          />
        ))}
      </div>
      <div className="panel mt-6 h-48 animate-pulse rounded-2xl bg-[var(--line)]/60" />
      <div className="panel mt-4 h-32 animate-pulse rounded-2xl bg-[var(--line)]/40" />
    </main>
  );
}
