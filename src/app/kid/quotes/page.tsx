import { createServiceClient } from "@/lib/supabase/admin";
import { resolveActiveChild } from "@/lib/active-child";
import { QuotesLibraryClient } from "@/components/QuotesLibraryClient";
import type { ChildQuoteRow } from "@/app/api/kid/quotes/route";

export const dynamic = "force-dynamic";

export default async function KidQuotesPage() {
  const active = await resolveActiveChild();
  const canUse = Boolean(active && active.via === "kid");

  let initialQuotes: ChildQuoteRow[] = [];
  if (canUse && active) {
    const admin = createServiceClient();
    const { data } = await admin
      .from("child_quotes")
      .select(
        "id, quote_text, source_reference, source_precise, source_label, reading_role, reading_date, created_at",
      )
      .eq("child_id", active.childId)
      .order("created_at", { ascending: false });
    initialQuotes = (data ?? []) as ChildQuoteRow[];
  }

  return (
    <QuotesLibraryClient
      canUse={canUse}
      initialQuotes={initialQuotes}
      childName={active && canUse ? active.displayName : null}
    />
  );
}
