import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { todayInRiga } from "@/lib/dates";
import { AGE_BANDS } from "@/lib/age-bands";

/** Safe diagnostics: which Supabase host + whether today's rows exist. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date") || todayInRiga();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  let host = "";
  try {
    host = supabaseUrl ? new URL(supabaseUrl).host : "";
  } catch {
    host = "invalid_url";
  }

  try {
    const admin = createServiceClient();
    const { data: reading, error: readingErr } = await admin
      .from("daily_readings")
      .select("reading_date, readings, daily_quote")
      .eq("reading_date", date)
      .maybeSingle();

    const roles = Array.isArray(reading?.readings)
      ? reading.readings
          .map((r: { role?: string }) => r.role)
          .filter(Boolean)
      : [];

    const { data: bands, error: bandErr } = await admin
      .from("age_band_lessons")
      .select("age_band, generation_status")
      .eq("reading_date", date);

    const byBand = Object.fromEntries(
      AGE_BANDS.map((b) => {
        const row = bands?.find((x) => x.age_band === b.id);
        return [b.id, row?.generation_status ?? "missing"];
      }),
    );

    return NextResponse.json({
      ok: true,
      date,
      supabaseHost: host,
      reading: {
        exists: Boolean(reading),
        hasQuote: Boolean(reading?.daily_quote),
        roles,
        error: readingErr?.message ?? null,
      },
      ageBands: byBand,
      bandError: bandErr?.message ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        date,
        supabaseHost: host,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
