import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { resolveActiveChild } from "@/lib/active-child";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: Request) {
  const active = await resolveActiveChild();
  if (!active) {
    return NextResponse.json({ error: "Nepieciešama bērna sesija." }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Trūkst faila." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Atļauti tikai JPEG, PNG vai WebP." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Fails pārāk liels (maks. 2 MB)." },
      { status: 400 },
    );
  }

  const ext =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${active.familyId}/${active.childId}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const admin = createServiceClient();

  const { data: existing } = await admin
    .from("children")
    .select("avatar_url")
    .eq("id", active.childId)
    .single();

  const { error: upErr } = await admin.storage
    .from("child-avatars")
    .upload(path, buffer, { contentType: file.type, upsert: false });
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { data: pub } = admin.storage.from("child-avatars").getPublicUrl(path);
  const avatar_url = pub.publicUrl;

  const { data: child, error } = await admin
    .from("children")
    .update({
      avatar_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", active.childId)
    .select(
      "id, display_name, age, avatar_emoji, avatar_url, notifications_enabled",
    )
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Best-effort cleanup of previous object
  if (existing?.avatar_url) {
    const marker = "/child-avatars/";
    const idx = existing.avatar_url.indexOf(marker);
    if (idx >= 0) {
      const oldPath = decodeURIComponent(
        existing.avatar_url.slice(idx + marker.length).split("?")[0],
      );
      await admin.storage.from("child-avatars").remove([oldPath]);
    }
  }

  return NextResponse.json({ ok: true, child });
}

export async function DELETE() {
  const active = await resolveActiveChild();
  if (!active) {
    return NextResponse.json({ error: "Nepieciešama bērna sesija." }, { status: 401 });
  }

  const admin = createServiceClient();
  const { data: existing } = await admin
    .from("children")
    .select("avatar_url")
    .eq("id", active.childId)
    .single();

  if (existing?.avatar_url) {
    const marker = "/child-avatars/";
    const idx = existing.avatar_url.indexOf(marker);
    if (idx >= 0) {
      const oldPath = decodeURIComponent(
        existing.avatar_url.slice(idx + marker.length).split("?")[0],
      );
      await admin.storage.from("child-avatars").remove([oldPath]);
    }
  }

  const { data: child, error } = await admin
    .from("children")
    .update({
      avatar_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", active.childId)
    .select(
      "id, display_name, age, avatar_emoji, avatar_url, notifications_enabled",
    )
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, child });
}
