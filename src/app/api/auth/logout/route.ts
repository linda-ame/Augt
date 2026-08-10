import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clearKidSessionCookie, setParentViewChild } from "@/lib/kid-session";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  await clearKidSessionCookie();
  await setParentViewChild(null);
  return NextResponse.json({ ok: true });
}
