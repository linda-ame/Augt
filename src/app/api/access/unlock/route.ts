import { NextResponse } from "next/server";
import {
  createFamilyAccessToken,
  getConfiguredAccessCode,
  setFamilyAccessCookie,
  verifyAccessCode,
} from "@/lib/family-access";

export async function POST(req: Request) {
  if (!getConfiguredAccessCode()) {
    return NextResponse.json(
      { error: "Piekļuves kods nav konfigurēts." },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => null)) as { code?: string } | null;
  const code = body?.code?.trim() ?? "";
  if (!code) {
    return NextResponse.json({ error: "Ievadi piekļuves kodu." }, { status: 400 });
  }

  const ok = await verifyAccessCode(code);
  if (!ok) {
    return NextResponse.json({ error: "Nepareizs kods." }, { status: 401 });
  }

  const token = await createFamilyAccessToken();
  await setFamilyAccessCookie(token);
  return NextResponse.json({ ok: true });
}
