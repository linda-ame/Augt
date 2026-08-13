import { after, NextResponse } from "next/server";
import { sendMorningPushToAll } from "@/lib/push";
import { todayInRiga } from "@/lib/dates";

/** Sending to many subscriptions can exceed short cron HTTP timeouts. */
export const maxDuration = 120;

/**
 * Morning push cron (cron-job.org).
 * Default: 202 + background send (fits ~30s HTTP timeouts).
 * Optional `?wait=1` waits for completion.
 */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const date = url.searchParams.get("date") || todayInRiga();
  const wait = url.searchParams.get("wait") === "1";

  if (wait) {
    try {
      const details = await sendMorningPushToAll(date);
      return NextResponse.json(details);
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: err instanceof Error ? err.message : String(err) },
        { status: 500 },
      );
    }
  }

  after(async () => {
    try {
      await sendMorningPushToAll(date);
    } catch (err) {
      console.error(
        "[cron/morning-push] background failed:",
        err instanceof Error ? err.message : err,
      );
    }
  });

  return NextResponse.json(
    { ok: true, accepted: true, mode: "background", date },
    { status: 202 },
  );
}

export async function GET(req: Request) {
  return POST(req);
}
