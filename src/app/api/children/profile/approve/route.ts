import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { approveChildProfile } from "@/services/generation";

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
    profileText?: string;
    generateToday?: boolean;
  };
  const childId = body.childId;
  if (!childId) {
    return NextResponse.json({ error: "Trūkst childId." }, { status: 400 });
  }

  const { data: family } = await supabase
    .from("families")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();
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
    const result = await approveChildProfile(childId, {
      profileText: body.profileText,
      generateToday: body.generateToday !== false,
    });
    return NextResponse.json({ ok: true, ...result });
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
