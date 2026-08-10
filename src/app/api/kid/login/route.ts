import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { normalizeFamilyCode } from "@/lib/codes";
import { verifyPersonalCode } from "@/lib/personal-code";
import { createKidToken, setKidSessionCookie } from "@/lib/kid-session";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    familyCode?: string;
    childId?: string;
    personalCode?: string;
  };

  const familyCode = normalizeFamilyCode(body.familyCode || "");
  const childId = body.childId || "";
  const personalCode = body.personalCode || "";

  if (!familyCode || !childId || !personalCode) {
    return NextResponse.json({ error: "Trūkst ievades datu." }, { status: 400 });
  }

  const admin = createServiceClient();
  const { data: family } = await admin
    .from("families")
    .select("id")
    .eq("family_code", familyCode)
    .maybeSingle();
  if (!family) {
    return NextResponse.json({ error: "Ģimene nav atrasta." }, { status: 404 });
  }

  const { data: child } = await admin
    .from("children")
    .select("id, family_id, display_name, personal_code_hash, active")
    .eq("id", childId)
    .eq("family_id", family.id)
    .maybeSingle();

  if (!child || !child.active) {
    return NextResponse.json({ error: "Bērns nav atrasts." }, { status: 404 });
  }

  const ok = await verifyPersonalCode(personalCode, child.personal_code_hash);
  if (!ok) {
    return NextResponse.json({ error: "Nepareizs personīgais kods." }, { status: 401 });
  }

  const token = await createKidToken({
    childId: child.id,
    familyId: child.family_id,
    displayName: child.display_name,
  });
  await setKidSessionCookie(token);

  return NextResponse.json({ ok: true, displayName: child.display_name });
}
