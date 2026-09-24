import { NextResponse } from "next/server";
import { isAgeBandId } from "@/lib/age-bands";
import { isFamilyModeEnabled } from "@/lib/dev-features";
import { isFamilyModeId } from "@/lib/family-content";
import {
  clearGuestAgeBandCookie,
  setGuestAgeBandCookie,
} from "@/lib/guest-age";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { band?: string } | null;
  const band = body?.band?.trim() ?? "";

  if (!band) {
    await clearGuestAgeBandCookie();
    return NextResponse.json({ ok: true, cleared: true });
  }

  if (!isAgeBandId(band)) {
    return NextResponse.json({ error: "Nezināma vecuma grupa." }, { status: 400 });
  }

  if (isFamilyModeId(band)) {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (!isFamilyModeEnabled(host)) {
      return NextResponse.json(
        { error: "Ģimenes režīms šobrīd pieejams tikai lokāli." },
        { status: 403 },
      );
    }
  }

  await setGuestAgeBandCookie(band);
  return NextResponse.json({ ok: true, band });
}
