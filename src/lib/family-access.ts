import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { timingSafeEqual } from "crypto";

export const FAMILY_ACCESS_COOKIE = "augt_family_access";

function secretKey() {
  const secret = process.env.KID_SESSION_SECRET;
  if (!secret) throw new Error("Trūkst KID_SESSION_SECRET.");
  return new TextEncoder().encode(secret);
}

function codesMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided.trim());
  const b = Buffer.from(expected.trim());
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function getConfiguredAccessCode(): string | null {
  const code = process.env.FAMILY_ACCESS_CODE?.trim();
  return code || null;
}

export async function verifyAccessCode(code: string): Promise<boolean> {
  const expected = getConfiguredAccessCode();
  if (!expected) return false;
  return codesMatch(code, expected);
}

export async function createFamilyAccessToken(): Promise<string> {
  return new SignJWT({ access: "family" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("90d")
    .sign(secretKey());
}

export async function hasFamilyAccess(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(FAMILY_ACCESS_COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload.access === "family";
  } catch {
    return false;
  }
}

export async function setFamilyAccessCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(FAMILY_ACCESS_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
}
