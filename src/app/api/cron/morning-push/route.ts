import { NextResponse } from "next/server";
import { sendMorningPushToAll } from "@/lib/push";
import { todayInRiga } from "@/lib/dates";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const date = url.searchParams.get("date") || todayInRiga();
    const details = await sendMorningPushToAll(date);
    return NextResponse.json(details);
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
