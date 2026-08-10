import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hashPersonalCode } from "@/lib/personal-code";
import { onChildProfileReady } from "@/services/generation";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nepieciešama autentifikācija." }, { status: 401 });
  }

  const body = (await req.json()) as {
    displayName?: string;
    age?: number;
    personalCode?: string;
    goalIds?: string[];
  };

  const displayName = body.displayName?.trim();
  const age = Number(body.age);
  const personalCode = body.personalCode?.trim();
  const goalIds = Array.isArray(body.goalIds) ? body.goalIds : [];

  if (!displayName || !personalCode || !age || age < 3 || age > 20) {
    return NextResponse.json({ error: "Nepilnīgi bērna dati." }, { status: 400 });
  }

  const { data: family } = await supabase
    .from("families")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!family) {
    return NextResponse.json({ error: "Vispirms izveido ģimeni." }, { status: 400 });
  }

  const personal_code_hash = await hashPersonalCode(personalCode);
  const { data: child, error } = await supabase
    .from("children")
    .insert({
      family_id: family.id,
      display_name: displayName,
      age,
      personal_code_hash,
      selected_goal_ids: goalIds,
    })
    .select("*")
    .single();

  if (error || !child) {
    return NextResponse.json(
      { error: error?.message || "Neizdevās pievienot bērnu." },
      { status: 500 },
    );
  }

  // Immediate generation for today (does not wait for ~00:10 cron)
  let generation: unknown = null;
  let generationError: string | null = null;
  try {
    generation = await onChildProfileReady(child.id);
  } catch (err) {
    generationError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({ child, generation, generationError });
}
