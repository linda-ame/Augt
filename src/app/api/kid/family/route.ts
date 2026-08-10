import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { normalizeFamilyCode } from "@/lib/codes";

export async function POST(req: Request) {
  const body = (await req.json()) as { familyCode?: string };
  const familyCode = normalizeFamilyCode(body.familyCode || "");
  if (familyCode.length < 4) {
    return NextResponse.json({ error: "Ievadi derīgu ģimenes kodu." }, { status: 400 });
  }

  const admin = createServiceClient();
  const { data: family, error } = await admin
    .from("families")
    .select("id, name, family_code")
    .eq("family_code", familyCode)
    .maybeSingle();

  if (error || !family) {
    return NextResponse.json({ error: "Ģimene ar šādu kodu nav atrasta." }, { status: 404 });
  }

  const { data: children } = await admin
    .from("children")
    .select("id, display_name")
    .eq("family_id", family.id)
    .eq("active", true)
    .order("display_name");

  return NextResponse.json({
    family: { id: family.id, name: family.name },
    children: children ?? [],
  });
}
