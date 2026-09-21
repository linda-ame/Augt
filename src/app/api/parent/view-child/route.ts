import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { setParentViewChild } from "@/lib/kid-session";
import { verifyPersonalCode } from "@/lib/personal-code";
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
    childId?: string | null;
    pin?: string;
    familyId?: string;
  };
  const childId = body.childId;
  const pin = body.pin?.trim() ?? "";

  let family = body.familyId
    ? (
        await supabase
          .from("families")
          .select("id, name, family_code, parent_gate_pin_hash")
          .eq("id", body.familyId)
          .eq("owner_user_id", user.id)
          .maybeSingle()
      ).data
    : null;

  if (!family) {
    family = await getOwnedFamily(supabase, user.id);
  }
  if (!family) {
    return NextResponse.json({ error: "Ģimene nav atrasta." }, { status: 404 });
  }

  // Exit child preview → require parental gate PIN.
  if (!childId) {
    if (!family.parent_gate_pin_hash) {
      return NextResponse.json(
        { error: "Nav iestatīts atgriešanās kods.", needPin: true },
        { status: 400 },
      );
    }
    if (!pin) {
      return NextResponse.json(
        { error: "Ievadi atgriešanās kodu.", needPin: true },
        { status: 400 },
      );
    }
    const ok = await verifyPersonalCode(pin, family.parent_gate_pin_hash);
    if (!ok) {
      return NextResponse.json({ error: "Nepareizs kods." }, { status: 403 });
    }
    await setParentViewChild(null);
    return NextResponse.json({ ok: true });
  }

  // Enter child preview → PIN must already exist (created on parent dashboard).
  if (!family.parent_gate_pin_hash) {
    return NextResponse.json(
      {
        error: "Vispirms izveido kodu, lai vēlāk varētu atgriezties vecāku profilā.",
        needPin: true,
      },
      { status: 400 },
    );
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
