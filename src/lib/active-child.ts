import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import {
  getKidSession,
  getParentViewChild,
} from "@/lib/kid-session";
import {
  approximateAge,
  getAgeBand,
  guestChildId,
  type AgeBandId,
} from "@/lib/age-bands";
import { getGuestAgeBand } from "@/lib/guest-age";

export type ActiveChildContext = {
  childId: string;
  familyId: string;
  displayName: string;
  age: number;
  avatar_emoji: string | null;
  avatar_url: string | null;
  notifications_enabled: boolean;
  via: "kid" | "parent" | "guest";
  ageBandId?: AgeBandId;
};

/** Resolve current kid session, parent preview, or public guest age band. */
export async function resolveActiveChild(): Promise<ActiveChildContext | null> {
  const admin = createServiceClient();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const parentViewChildId = user ? await getParentViewChild() : null;
  const kidSession = await getKidSession();

  if (user && parentViewChildId) {
    const { data: family } = await supabase
      .from("families")
      .select("id")
      .eq("owner_user_id", user.id)
      .maybeSingle();
    if (!family) return null;
    const { data: child } = await admin
      .from("children")
      .select(
        "id, family_id, display_name, age, avatar_emoji, avatar_url, notifications_enabled",
      )
      .eq("id", parentViewChildId)
      .eq("family_id", family.id)
      .maybeSingle();
    if (!child) return null;
    return {
      childId: child.id,
      familyId: child.family_id,
      displayName: child.display_name,
      age: child.age,
      avatar_emoji: child.avatar_emoji,
      avatar_url: child.avatar_url,
      notifications_enabled: Boolean(child.notifications_enabled),
      via: "parent",
    };
  }

  if (kidSession) {
    const { data: child } = await admin
      .from("children")
      .select(
        "id, family_id, display_name, age, avatar_emoji, avatar_url, notifications_enabled",
      )
      .eq("id", kidSession.childId)
      .maybeSingle();
    if (!child) return null;

    return {
      childId: child.id,
      familyId: child.family_id,
      displayName: child.display_name,
      age: child.age,
      avatar_emoji: child.avatar_emoji,
      avatar_url: child.avatar_url,
      notifications_enabled: Boolean(child.notifications_enabled),
      via: "kid",
    };
  }

  const band = await getGuestAgeBand();
  if (band) {
    const meta = getAgeBand(band);
    return {
      childId: guestChildId(band),
      familyId: "guest",
      displayName: meta.label,
      age: approximateAge(band),
      avatar_emoji: null,
      avatar_url: null,
      notifications_enabled: false,
      via: "guest",
      ageBandId: band,
    };
  }

  return null;
}
