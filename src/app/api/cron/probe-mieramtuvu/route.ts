import { NextResponse } from "next/server";
import { todayInRiga } from "@/lib/dates";
import { getScriptureSource } from "@/services/scriptureSource";

export const maxDuration = 60;

/**
 * Read-only connectivity check: fetch today's (or ?date=) Mieram tuvu page
 * from the app host. Does not write to DB and does not run AI generation.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const date = url.searchParams.get("date") || todayInRiga();
  const started = Date.now();

  try {
    const scripture = await getScriptureSource().fetchForDate(date);
    return NextResponse.json({
      ok: true,
      date,
      sourceUrl: scripture.sourceUrl,
      readingCount: scripture.readings.length,
      roles: scripture.readings.map((r) => r.role),
      refs: scripture.readings.map((r) => r.reference),
      hasQuote: Boolean(scripture.dailyQuote),
      durationMs: Date.now() - started,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        date,
        durationMs: Date.now() - started,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    );
  }
}

export async function POST(req: Request) {
  return GET(req);
}
