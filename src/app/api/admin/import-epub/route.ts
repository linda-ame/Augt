import { NextResponse } from "next/server";
import { importMieramTuvuEpub } from "@/services/scriptureSource/import-epub";

export const maxDuration = 120;

/**
 * Upload a monthly Mieram tuvu EPUB → parse → upsert daily_readings.
 * Auth: Authorization: Bearer $CRON_SECRET
 *
 * curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
 *   -F "file=@Mieram-tuvu-2026-10.epub" \
 *   "$APP_URL/api/admin/import-epub"
 */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Trūkst faila (multipart field “file”)." },
      { status: 400 },
    );
  }
  if (!/\.epub$/i.test(file.name)) {
    return NextResponse.json(
      { error: "Fails jābūt .epub" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const result = await importMieramTuvuEpub({
      buffer,
      originalName: file.name,
      // Vercel filesystem is ephemeral — DB upsert is the source of truth.
      persistFile: process.env.VERCEL ? false : true,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
