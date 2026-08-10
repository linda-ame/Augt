import { cookies } from "next/headers";
import {
  AGE_BAND_COOKIE,
  isAgeBandId,
  type AgeBandId,
} from "@/lib/age-bands";

export async function getGuestAgeBand(): Promise<AgeBandId | null> {
  const store = await cookies();
  const value = store.get(AGE_BAND_COOKIE)?.value;
  return isAgeBandId(value) ? value : null;
}

export async function setGuestAgeBandCookie(band: AgeBandId) {
  const store = await cookies();
  store.set(AGE_BAND_COOKIE, band, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearGuestAgeBandCookie() {
  const store = await cookies();
  store.delete(AGE_BAND_COOKIE);
}
