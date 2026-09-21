import { after, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { resolveActiveChild } from "@/lib/active-child";
import { locateQuoteVerses } from "@/services/ai/generate";

export type ChildQuoteRow = {
  id: string;
  quote_text: string;
  source_reference: string;
  source_precise: string | null;
  source_label: string | null;
  reading_role: string | null;
  reading_date: string | null;
  created_at: string;
};

function canSaveQuotes(via: string) {
  return via === "kid";
}

export async function GET() {
  const active = await resolveActiveChild();
  if (!active || !canSaveQuotes(active.via)) {
    return NextResponse.json({ error: "Nepieciešama bērna sesija." }, { status: 401 });
  }

  const admin = createServiceClient();
  const { data, error } = await admin
    .from("child_quotes")
    .select(
      "id, quote_text, source_reference, source_precise, source_label, reading_role, reading_date, created_at",
    )
    .eq("child_id", active.childId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ quotes: (data ?? []) as ChildQuoteRow[] });
}

export async function POST(req: Request) {
  const active = await resolveActiveChild();
  if (!active || !canSaveQuotes(active.via)) {
    return NextResponse.json(
      { error: "Citātus var saglabāt pieslēgts bērns." },
      { status: 401 },
    );
  }

  const body = (await req.json()) as {
    quoteText?: string;
    sourceReference?: string;
    sourceLabel?: string;
    readingRole?: string;
    readingDate?: string;
    readingText?: string;
  };

  const quoteText = body.quoteText?.replace(/\s+/g, " ").trim() || "";
  const sourceReference = body.sourceReference?.trim() || "";
  if (quoteText.length < 8) {
    return NextResponse.json({ error: "Citāts ir pārāk īss." }, { status: 400 });
  }
  if (quoteText.length > 2000) {
    return NextResponse.json({ error: "Citāts ir pārāk garš." }, { status: 400 });
  }
  if (!sourceReference) {
    return NextResponse.json({ error: "Trūkst avota atsauces." }, { status: 400 });
  }

  const admin = createServiceClient();
  const { data, error } = await admin
    .from("child_quotes")
    .insert({
      child_id: active.childId,
      quote_text: quoteText,
      source_reference: sourceReference,
      source_precise: null,
      source_label: body.sourceLabel?.trim() || null,
      reading_role: body.readingRole?.trim() || null,
      reading_date: body.readingDate || null,
    })
    .select(
      "id, quote_text, source_reference, source_precise, source_label, reading_role, reading_date, created_at",
    )
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Neizdevās saglabāt citātu." },
      { status: 500 },
    );
  }

  // Don't block save on AI — refine verse numbers after the response.
  const readingText = body.readingText?.trim() || "";
  const quoteId = data.id;
  if (readingText) {
    after(async () => {
      try {
        const precise = await locateQuoteVerses({
          readingReference: sourceReference,
          readingText,
          quoteText,
        });
        if (!precise) return;
        await admin
          .from("child_quotes")
          .update({ source_precise: precise })
          .eq("id", quoteId)
          .eq("child_id", active.childId);
      } catch (err) {
        console.warn(
          "[quotes] verse refine failed",
          err instanceof Error ? err.message : err,
        );
      }
    });
  }

  return NextResponse.json({ ok: true, quote: data as ChildQuoteRow });
}
