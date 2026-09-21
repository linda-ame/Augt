import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { resolveActiveChild } from "@/lib/active-child";
import { isAllowedAvatarEmoji } from "@/lib/avatar-emojis";

export async function PATCH(req: Request) {
  const active = await resolveActiveChild();
  if (!active) {
    return NextResponse.json({ error: "Nepieciešama bērna sesija." }, { status: 401 });
  }

  const body = (await req.json()) as {
    avatar_emoji?: string | null;
    notifications_enabled?: boolean;
  };

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if ("avatar_emoji" in body) {
    if (body.avatar_emoji === null || body.avatar_emoji === "") {
      patch.avatar_emoji = null;
    } else if (
      typeof body.avatar_emoji === "string" &&
      isAllowedAvatarEmoji(body.avatar_emoji)
    ) {
      // Emoji replaces photo (same either-or rule as BeeMazing).
      patch.avatar_emoji = body.avatar_emoji;
      patch.avatar_url = null;
    } else {
      return NextResponse.json(
        { error: "Šis emoji nav atļauts profilam." },
        { status: 400 },
      );
    }
  }

  if (typeof body.notifications_enabled === "boolean") {
    patch.notifications_enabled = body.notifications_enabled;
  }

  const admin = createServiceClient();

  let previousAvatarUrl: string | null = null;
  if (patch.avatar_url === null && patch.avatar_emoji) {
    const { data: existing } = await admin
      .from("children")
      .select("avatar_url")
      .eq("id", active.childId)
      .single();
    previousAvatarUrl = existing?.avatar_url ?? null;
  }

  const { data, error } = await admin
    .from("children")
    .update(patch)
    .eq("id", active.childId)
    .select(
      "id, display_name, age, avatar_emoji, avatar_url, notifications_enabled",
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (previousAvatarUrl) {
    const marker = "/child-avatars/";
    const idx = previousAvatarUrl.indexOf(marker);
    if (idx >= 0) {
      const oldPath = decodeURIComponent(
        previousAvatarUrl.slice(idx + marker.length).split("?")[0],
      );
      await admin.storage.from("child-avatars").remove([oldPath]);
    }
  }

  return NextResponse.json({ ok: true, child: data });
}
