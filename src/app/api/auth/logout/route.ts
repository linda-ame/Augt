import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clearKidSessionCookie, setParentViewChild } from "@/lib/kid-session";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Forgotten parental gate PIN: wipe it so parent can create a new one after re-login.
  if (user) {
    await supabase
      .from("families")
      .update({ parent_gate_pin_hash: null })
      .eq("owner_user_id", user.id);
  }

  await supabase.auth.signOut();
  await clearKidSessionCookie();
  await setParentViewChild(null);
  return NextResponse.json({ ok: true });
}
