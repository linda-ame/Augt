import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { ensureOwnedFamily, getOwnedFamily } from "@/lib/family";

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
    const existing = await getOwnedFamily(supabase, user.id);
    if (!existing) {
      const created = await ensureOwnedFamily(supabase, user.id);
      if (!created) {
        const admin = createServiceClient();
        await ensureOwnedFamily(admin, user.id);
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
