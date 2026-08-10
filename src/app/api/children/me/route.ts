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
      patch.avatar_emoji = body.avatar_emoji;
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
  return NextResponse.json({ ok: true, child: data });
}
