import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const KID_COOKIE = "augt_kid_session";
export const PARENT_VIEW_COOKIE = "augt_parent_view_child";

type KidPayload = {
  childId: string;
  familyId: string;
  displayName: string;
};

function secretKey() {
  const secret = process.env.KID_SESSION_SECRET;
  if (!secret) throw new Error("Trūkst KID_SESSION_SECRET.");
  return new TextEncoder().encode(secret);
}

export async function createKidToken(payload: KidPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());
}

export async function verifyKidToken(
  token: string,
): Promise<KidPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (
      typeof payload.childId === "string" &&
      typeof payload.familyId === "string" &&
      typeof payload.displayName === "string"
    ) {
      return {
        childId: payload.childId,
        familyId: payload.familyId,
        displayName: payload.displayName,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getKidSession(): Promise<KidPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(KID_COOKIE)?.value;
  if (!token) return null;
  return verifyKidToken(token);
}

export async function setKidSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(KID_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearKidSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(KID_COOKIE);
}

export async function setParentViewChild(childId: string | null) {
  const cookieStore = await cookies();
  if (!childId) {
    cookieStore.delete(PARENT_VIEW_COOKIE);
    return;
  }
  cookieStore.set(PARENT_VIEW_COOKIE, childId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function getParentViewChild(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(PARENT_VIEW_COOKIE)?.value ?? null;
}
