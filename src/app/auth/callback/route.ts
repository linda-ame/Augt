import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { generateFamilyCode } from "@/lib/codes";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/parent";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    const msg = errorDescription || error;
    return NextResponse.redirect(
      `${origin}/login?mode=parent&error=${encodeURIComponent(msg)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?mode=parent`);
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(
      `${origin}/login?mode=parent&error=${encodeURIComponent(exchangeError.message)}`,
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: existing } = await supabase
      .from("families")
      .select("id")
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (!existing) {
      let created = false;
      for (let i = 0; i < 5 && !created; i++) {
        const { error: insertError } = await supabase.from("families").insert({
          name: "Mana ģimene",
          family_code: generateFamilyCode(),
          owner_user_id: user.id,
        });
        if (!insertError) created = true;
      }

      if (!created) {
        const admin = createServiceClient();
        await admin.from("families").insert({
          name: "Mana ģimene",
          family_code: generateFamilyCode(),
          owner_user_id: user.id,
        });
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
