import { after, NextResponse } from "next/server";
import { isAgeBandId } from "@/lib/age-bands";
import {
  generateDailyCronSlice,
  generateDailyForAllActiveChildren,
} from "@/services/generation";

/** One age-band (or children) slice; keep under Vercel limits. */
export const maxDuration = 300;

/**
 * Cron entrypoint (cron-job.org).
 *
 * Preferred (avoids timeouts):
 *   ?band=age_7_9 | age_10_12 | age_13_15 | age_16_19
 *   ?children=1
 *
 * Scripture is fetched once into daily_readings (first caller); later slices reuse it.
 * Default without params: full run (legacy; may hit time limits).
 * Optional ?wait=1 waits for completion.
 */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const wait = url.searchParams.get("wait") === "1";
  const bandParam = url.searchParams.get("band");
  const children = url.searchParams.get("children") === "1";

  if (bandParam && !isAgeBandId(bandParam)) {
    return NextResponse.json(
      {
        error: "Invalid band",
        allowed: ["age_7_9", "age_10_12", "age_13_15", "age_16_19"],
      },
      { status: 400 },
    );
  }

  const band = bandParam && isAgeBandId(bandParam) ? bandParam : undefined;
  const sliced = Boolean(band) || children;

  const run = async () => {
    if (sliced) {
      return generateDailyCronSlice({
        trigger: "cron",
        band,
        children,
      });
    }
    return generateDailyForAllActiveChildren("cron");
  };

  if (wait) {
    try {
      const details = await run();
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
      await run();
    } catch (err) {
      console.error(
        "[cron/generate-daily] background failed:",
        err instanceof Error ? err.message : err,
      );
    }
  });

  return NextResponse.json(
    {
      ok: true,
      accepted: true,
      mode: "background",
      band: band ?? null,
      children,
    },
    { status: 202 },
  );
}

export async function GET(req: Request) {
  return POST(req);
}
