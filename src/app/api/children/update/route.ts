import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hashPersonalCode } from "@/lib/personal-code";
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
    displayName?: string;
    age?: number;
    personalCode?: string;
  };

  const childId = body.childId?.trim();
  const displayName = body.displayName?.trim();
  const age = Number(body.age);
  const personalCode = body.personalCode?.trim();

  if (!childId || !displayName || !age || age < 3 || age > 20) {
    return NextResponse.json({ error: "Nepilnīgi bērna dati." }, { status: 400 });
  }
  if (personalCode && personalCode.length < 4) {
    return NextResponse.json(
      { error: "Jaunajam kodam jābūt vismaz 4 simboliem." },
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

  const patch: Record<string, unknown> = {
    display_name: displayName,
    age,
    updated_at: new Date().toISOString(),
  };
  if (personalCode) {
    patch.personal_code_hash = await hashPersonalCode(personalCode);
  }

  const { data: updated, error } = await supabase
    .from("children")
    .update(patch)
    .eq("id", childId)
    .select(
      "id, display_name, age, active, generated_profile, profile_draft, profile_status, parent_notes",
    )
    .single();

  if (error || !updated) {
    return NextResponse.json(
      { error: error?.message || "Neizdevās saglabāt." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, child: updated });
}
