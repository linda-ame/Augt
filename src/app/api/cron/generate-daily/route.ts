import { NextResponse } from "next/server";
import { generateDailyForAllActiveChildren } from "@/services/generation";

/** Full daily generation (readings + age bands + children) can take several minutes. */
export const maxDuration = 300;

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

export async function GET(req: Request) {
  return POST(req);
}
