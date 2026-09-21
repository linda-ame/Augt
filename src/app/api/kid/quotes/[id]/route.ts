import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { resolveActiveChild } from "@/lib/active-child";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const active = await resolveActiveChild();
  if (!active || active.via !== "kid") {
    return NextResponse.json({ error: "Nepieciešama bērna sesija." }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "Trūkst id." }, { status: 400 });
  }

  const admin = createServiceClient();
  const { error } = await admin
    .from("child_quotes")
    .delete()
    .eq("id", id)
    .eq("child_id", active.childId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
