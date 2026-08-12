import webpush from "web-push";
import type { AgeBandId } from "@/lib/age-bands";
import { createServiceClient } from "@/lib/supabase/admin";
import { todayInRiga } from "@/lib/dates";

export type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  age_band: AgeBandId | null;
};

export type SerializedPushSubscription = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

let vapidConfigured = false;

export function ensureVapid() {
  if (vapidConfigured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error("Trūkst VAPID atslēgu (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY).");
  }
  webpush.setVapidDetails(
    "mailto:hello@augt.lv",
    publicKey,
    privateKey,
  );
  vapidConfigured = true;
}

export function isPushConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() &&
      process.env.VAPID_PRIVATE_KEY?.trim(),
  );
}

/** Safe diagnostics for env setup (no secret values). */
export function pushConfigStatus() {
  const hasPublic = Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim());
  const hasPrivate = Boolean(process.env.VAPID_PRIVATE_KEY?.trim());
  return {
    configured: hasPublic && hasPrivate,
    hasPublicKey: hasPublic,
    hasPrivateKey: hasPrivate,
  };
}

function truncate(text: string, max: number) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

export function buildMorningPayload(quote: string | null) {
  const quotePart = quote ? truncate(quote, 140) : null;
  const nudge = "Atver un izlasi šodienas Evaņģēliju.";
  const body = quotePart ? `${quotePart} — ${nudge}` : nudge;
  return {
    // Not "Augt" — OS already shows the app/site name.
    title: "Šodienas Dieva Vārds",
    body: truncate(body, 180),
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-96.png",
    url: "/kid",
  };
}

export async function resolveMorningContent(date = todayInRiga()) {
  const admin = createServiceClient();
  const { data: reading } = await admin
    .from("daily_readings")
    .select("daily_quote")
    .eq("reading_date", date)
    .maybeSingle();

  return {
    date,
    quote: (reading?.daily_quote as string | null)?.trim() || null,
  };
}

export async function upsertSubscription(
  sub: SerializedPushSubscription,
  ageBand: AgeBandId | null,
  userAgent: string | null,
) {
  const admin = createServiceClient();
  const { error } = await admin.from("push_subscriptions").upsert(
    {
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      age_band: ageBand,
      user_agent: userAgent,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );
  if (error) throw new Error(error.message);
}

export async function deleteSubscription(endpoint: string) {
  const admin = createServiceClient();
  const { error } = await admin
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);
  if (error) throw new Error(error.message);
}

export async function sendPushToSubscription(
  row: Pick<PushSubscriptionRow, "endpoint" | "p256dh" | "auth" | "id">,
  payload: ReturnType<typeof buildMorningPayload>,
) {
  ensureVapid();
  try {
    await webpush.sendNotification(
      {
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth },
      },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 12 },
    );
    return { ok: true as const };
  } catch (err) {
    const statusCode =
      err && typeof err === "object" && "statusCode" in err
        ? Number((err as { statusCode?: number }).statusCode)
        : undefined;
    // Gone / expired subscription
    if (statusCode === 404 || statusCode === 410) {
      await deleteSubscription(row.endpoint);
      return { ok: false as const, removed: true, statusCode };
    }
    return {
      ok: false as const,
      removed: false,
      statusCode,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function sendMorningPushToAll(date = todayInRiga()) {
  if (!isPushConfigured()) {
    return { ok: false as const, error: "VAPID nav konfigurēts", sent: 0, failed: 0, removed: 0 };
  }

  const content = await resolveMorningContent(date);
  const admin = createServiceClient();
  const { data: rows, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, age_band");

  if (error) throw new Error(error.message);

  let sent = 0;
  let failed = 0;
  let removed = 0;

  for (const row of (rows ?? []) as PushSubscriptionRow[]) {
    const payload = buildMorningPayload(content.quote);
    const result = await sendPushToSubscription(row, payload);
    if (result.ok) sent += 1;
    else {
      failed += 1;
      if (result.removed) removed += 1;
    }
  }

  return {
    ok: true as const,
    date: content.date,
    total: rows?.length ?? 0,
    sent,
    failed,
    removed,
  };
}
