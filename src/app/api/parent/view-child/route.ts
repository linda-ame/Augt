import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { setParentViewChild } from "@/lib/kid-session";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nepieciešama autentifikācija." }, { status: 401 });
  }

  const body = (await req.json()) as { childId?: string | null };
  const childId = body.childId;

  if (!childId) {
    await setParentViewChild(null);
    return NextResponse.json({ ok: true });
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

  await setParentViewChild(child.id);
  return NextResponse.json({ ok: true });
}
