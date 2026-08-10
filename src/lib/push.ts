import webpush from "web-push";
import type { AgeBandId } from "@/lib/age-bands";
import { createServiceClient } from "@/lib/supabase/admin";
import { normalizeGospelContent, type DailyLessonContent } from "@/lib/types";
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
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY,
  );
}

function truncate(text: string, max: number) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

export function buildMorningPayload(theme: string | null, quote: string | null) {
  const themePart = theme ? truncate(theme, 60) : null;
  const quotePart = quote ? truncate(quote, 120) : null;
  let body: string;
  if (themePart && quotePart) {
    body = `${themePart} — ${quotePart}`;
  } else if (themePart) {
    body = themePart;
  } else if (quotePart) {
    body = quotePart;
  } else {
    body = "Šodienas Dieva Vārds tevi gaida.";
  }
  return {
    title: "Augt",
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
    .select("daily_quote, liturgical_day")
    .eq("reading_date", date)
    .maybeSingle();

  const { data: lessons } = await admin
    .from("age_band_lessons")
    .select("age_band, content_json, generation_status")
    .eq("reading_date", date)
    .eq("generation_status", "success");

  const themeByBand = new Map<AgeBandId, string>();
  let fallbackTheme: string | null =
    (reading?.liturgical_day as string | null)?.trim() || null;

  for (const row of lessons ?? []) {
    const gospel = normalizeGospelContent(
      row.content_json as DailyLessonContent | null,
    );
    const title = gospel?.title?.trim();
    if (!title) continue;
    themeByBand.set(row.age_band as AgeBandId, title);
    if (!fallbackTheme) fallbackTheme = title;
  }

  return {
    date,
    quote: (reading?.daily_quote as string | null)?.trim() || null,
    fallbackTheme,
    themeByBand,
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
    const theme =
      (row.age_band && content.themeByBand.get(row.age_band)) ||
      content.fallbackTheme;
    const payload = buildMorningPayload(theme, content.quote);
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
