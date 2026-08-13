import { after, NextResponse } from "next/server";
import { generateDailyForAllActiveChildren } from "@/services/generation";

/** Background generation via `after()` can take several minutes on Vercel. */
export const maxDuration = 300;

/**
 * Cron entrypoint (cron-job.org / GitHub Actions).
 * Default: return 202 immediately and generate in `after()` so short HTTP
 * timeouts (e.g. cron-job.org ~30s) still work.
 * Optional `?wait=1` waits for completion (useful for debugging).
 */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const wait = url.searchParams.get("wait") === "1";

  if (wait) {
    try {
      const details = await generateDailyForAllActiveChildren("cron");
      return NextResponse.json({ ok: true, details });
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: err instanceof Error ? err.message : String(err) },
        { status: 500 },
      );
    }
  }

  after(async () => {
    try {
      await generateDailyForAllActiveChildren("cron");
    } catch (err) {
      console.error(
        "[cron/generate-daily] background failed:",
        err instanceof Error ? err.message : err,
      );
    }
  });

  return NextResponse.json(
    { ok: true, accepted: true, mode: "background" },
    { status: 202 },
  );
}

export async function GET(req: Request) {
  return POST(req);
}
