import { Suspense } from "react";
import { redirect } from "next/navigation";
import { resolveActiveChild } from "@/lib/active-child";
import { KidPrayersClient } from "@/components/KidPrayersClient";

export default async function KidPrayersPage() {
  const active = await resolveActiveChild();
  if (!active) redirect("/");

  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-2xl px-6 py-10 text-[var(--ink-soft)]">
          Ielādē…
        </main>
      }
    >
      <KidPrayersClient />
    </Suspense>
  );
}
