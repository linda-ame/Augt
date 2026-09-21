import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureOwnedFamily } from "@/lib/family";

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

  const family = await ensureOwnedFamily(supabase, user.id, name);
  if (!family) {
    return NextResponse.json({ error: "Neizdevās izveidot ģimeni." }, { status: 500 });
  }

  return NextResponse.json({
    id: family.id,
    family_code: family.family_code,
    name: family.name,
  });
}
