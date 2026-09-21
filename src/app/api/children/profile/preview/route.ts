import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  normalizeParentNotes,
  parentNotesHaveContent,
} from "@/lib/parent-notes";
import { generateChildProfile } from "@/services/ai/generate";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nepieciešama autentifikācija." }, { status: 401 });
  }

  const body = (await req.json()) as {
    age?: number;
    parentNotes?: unknown;
  };
  const age = Number(body.age);
  const parentNotes = normalizeParentNotes(body.parentNotes);

  if (!age || age < 3 || age > 20) {
    return NextResponse.json({ error: "Norādi derīgu vecumu." }, { status: 400 });
  }
  if (!parentNotesHaveContent(parentNotes)) {
    return NextResponse.json(
      { error: "Aizpildi vismaz vienu personalizācijas lauku." },
      { status: 400 },
    );
  }

  try {
    const profileDraft = await generateChildProfile({ age, notes: parentNotes });
    return NextResponse.json({ ok: true, profileDraft });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isQuota = /429|quota|rate/i.test(message);
    return NextResponse.json(
      {
        ok: false,
        error: isQuota
          ? "Gemini free tier kvota īslaicīgi pārsniegta. Uzgaidi dažas minūtes un mēģini vēlreiz."
          : message,
      },
      { status: isQuota ? 429 : 500 },
    );
  }
}
