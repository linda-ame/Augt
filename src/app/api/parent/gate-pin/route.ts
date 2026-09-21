import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hashPersonalCode } from "@/lib/personal-code";
import { getParentViewChild } from "@/lib/kid-session";
import { getOwnedFamily } from "@/lib/family";

const MIN_PIN_LENGTH = 4;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nepieciešama autentifikācija." }, { status: 401 });
  }

  const family = await getOwnedFamily(supabase, user.id);
  return NextResponse.json({
    hasPin: Boolean(family?.parent_gate_pin_hash),
  });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nepieciešama autentifikācija." }, { status: 401 });
  }

  // Only set/reset from the parent side — not while previewing as a child.
  const parentView = await getParentViewChild();
  if (parentView) {
    return NextResponse.json(
      { error: "Kodurežīmu var iestatīt tikai no vecāku profila." },
      { status: 403 },
    );
  }

  const body = (await req.json()) as { pin?: string; familyId?: string };
  const pin = body.pin?.trim() ?? "";
  if (pin.length < MIN_PIN_LENGTH) {
    return NextResponse.json(
      { error: `Kods jābūt vismaz ${MIN_PIN_LENGTH} simboliem.` },
      { status: 400 },
    );
  }

  let familyId = body.familyId?.trim() || null;
  if (familyId) {
    const { data: owned } = await supabase
      .from("families")
      .select("id")
      .eq("id", familyId)
      .eq("owner_user_id", user.id)
      .maybeSingle();
    if (!owned) {
      return NextResponse.json({ error: "Ģimene nav atrasta." }, { status: 404 });
    }
  } else {
    const family = await getOwnedFamily(supabase, user.id);
    if (!family) {
      return NextResponse.json({ error: "Ģimene nav atrasta." }, { status: 404 });
    }
    familyId = family.id;
  }

  const parent_gate_pin_hash = await hashPersonalCode(pin);
  const { error } = await supabase
    .from("families")
    .update({ parent_gate_pin_hash })
    .eq("id", familyId)
    .eq("owner_user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Neizdevās saglabāt kodu." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
