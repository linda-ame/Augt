import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateLessonForChild } from "@/services/generation";
import { getOwnedFamily } from "@/lib/family";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nepieciešama autentifikācija." }, { status: 401 });
  }

  const body = (await req.json()) as {
    childId?: string;
    comment?: string;
  };
  const childId = body.childId;
  const comment = body.comment?.trim() || undefined;
  if (!childId) {
    return NextResponse.json({ error: "Trūkst childId." }, { status: 400 });
  }
  if (comment && comment.length > 2000) {
    return NextResponse.json(
      { error: "Komentārs ir pārāk garš (maks. 2000 simboli)." },
      { status: 400 },
    );
  }

  const family = await getOwnedFamily(supabase, user.id);
  if (!family) {
    return NextResponse.json({ error: "Ģimene nav atrasta." }, { status: 404 });
  }

  const { data: child } = await supabase
    .from("children")
    .select("id")
    .eq("id", childId)
    .eq("family_id", family.id)
    .maybeSingle();
  if (!child) {
    return NextResponse.json({ error: "Bērns nav tavā ģimenē." }, { status: 403 });
  }

  try {
    const result = await generateLessonForChild(childId, {
      force: true,
      parentFeedback: comment,
    });
    if (
      result &&
      "skipped" in result &&
      result.skipped &&
      result.reason === "feature_disabled"
    ) {
      return NextResponse.json({
        ok: true,
        paused: true,
        result,
      });
    }
    return NextResponse.json({ ok: true, result });
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
