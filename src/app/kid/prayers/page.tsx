import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/admin";
import { resolveActiveChild } from "@/lib/active-child";
import { KidPrayersClient } from "@/components/KidPrayersClient";
import type { ChildPrayerRow } from "@/app/api/kid/prayers/route";

export const dynamic = "force-dynamic";

export default async function KidPrayersPage() {
  const active = await resolveActiveChild();
  if (!active) redirect("/");

  const canUseMyPrayers = active.via === "kid";
  let initialMyPrayers: ChildPrayerRow[] = [];

  if (canUseMyPrayers) {
    const admin = createServiceClient();
    const { data } = await admin
      .from("child_prayers")
      .select("id, title, body, created_at, updated_at")
      .eq("child_id", active.childId)
      .order("created_at", { ascending: false });
    initialMyPrayers = (data ?? []) as ChildPrayerRow[];
  }

  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-2xl px-6 py-10 text-[var(--ink-soft)]">
          Ielādē…
        </main>
      }
    >
      <KidPrayersClient
        canUseMyPrayers={canUseMyPrayers}
        initialMyPrayers={initialMyPrayers}
      />
    </Suspense>
  );
}
