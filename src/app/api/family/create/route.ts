import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateFamilyCode } from "@/lib/codes";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nepieciešama autentifikācija." }, { status: 401 });
  }

  const body = (await req.json()) as { name?: string };
  const name = body.name?.trim() || "Mana ģimene";

  const { data: existing } = await supabase
    .from("families")
    .select("id, family_code")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(existing);
  }

  let family_code = generateFamilyCode();
  for (let i = 0; i < 5; i++) {
    const { data, error } = await supabase
      .from("families")
      .insert({ name, family_code, owner_user_id: user.id })
      .select("id, family_code, name")
      .single();
    if (!error && data) {
      return NextResponse.json(data);
    }
    family_code = generateFamilyCode();
  }

  return NextResponse.json({ error: "Neizdevās izveidot ģimeni." }, { status: 500 });
}
