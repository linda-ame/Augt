import { NextResponse } from "next/server";
import { z } from "zod";
import { isAgeBandId } from "@/lib/age-bands";
import {
  deleteSubscription,
  isPushConfigured,
  pushConfigStatus,
  upsertSubscription,
} from "@/lib/push";

const subscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().min(1),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
  age_band: z.string().nullable().optional(),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().min(1),
});

export async function POST(req: Request) {
  if (!isPushConfigured()) {
    const status = pushConfigStatus();
    const missing = [
      !status.hasPublicKey ? "NEXT_PUBLIC_VAPID_PUBLIC_KEY" : null,
      !status.hasPrivateKey ? "VAPID_PRIVATE_KEY" : null,
    ].filter(Boolean);
    return NextResponse.json(
      {
        error:
          "Paziņojumi vēl nav konfigurēti serverī. Vercel → Settings → Environment Variables: pievieno " +
          missing.join(" un ") +
          ", tad Redeploy.",
        missing,
      },
      { status: 503 },
    );
  }

  try {
    const body = subscribeSchema.parse(await req.json());
    const ageBand =
      body.age_band && isAgeBandId(body.age_band) ? body.age_band : null;
    const userAgent = req.headers.get("user-agent");
    await upsertSubscription(body.subscription, ageBand, userAgent);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Kļūda" },
      { status: 400 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = unsubscribeSchema.parse(await req.json());
    await deleteSubscription(body.endpoint);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Kļūda" },
      { status: 400 },
    );
  }
}
