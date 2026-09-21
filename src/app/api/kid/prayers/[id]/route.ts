import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { resolveActiveChild } from "@/lib/active-child";

function canUse(via: string) {
  return via === "kid";
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const active = await resolveActiveChild();
  if (!active || !canUse(active.via)) {
    return NextResponse.json({ error: "Nepieciešama bērna sesija." }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "Trūkst id." }, { status: 400 });
  }

  const body = (await req.json()) as { title?: string; body?: string };
  const title = body.title?.replace(/\s+/g, " ").trim() || "";
  const text = body.body?.replace(/\r\n/g, "\n").trim() || "";

  if (title.length < 2) {
    return NextResponse.json({ error: "Ieraksti lūgšanas nosaukumu." }, { status: 400 });
  }
  if (title.length > 120) {
    return NextResponse.json({ error: "Nosaukums ir pārāk garš." }, { status: 400 });
  }
  if (text.length < 4) {
    return NextResponse.json({ error: "Ieraksti lūgšanas tekstu." }, { status: 400 });
  }
  if (text.length > 5000) {
    return NextResponse.json({ error: "Teksts ir pārāk garš." }, { status: 400 });
  }

  const admin = createServiceClient();
  const { data, error } = await admin
    .from("child_prayers")
    .update({
      title,
      body: text,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("child_id", active.childId)
    .select("id, title, body, created_at, updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Neizdevās saglabāt." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, prayer: data });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const active = await resolveActiveChild();
  if (!active || !canUse(active.via)) {
    return NextResponse.json({ error: "Nepieciešama bērna sesija." }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "Trūkst id." }, { status: 400 });
  }

  const admin = createServiceClient();
  const { error } = await admin
    .from("child_prayers")
    .delete()
    .eq("id", id)
    .eq("child_id", active.childId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
