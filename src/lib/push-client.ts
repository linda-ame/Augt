import { AGE_BAND_STORAGE_KEY, isAgeBandId, type AgeBandId } from "@/lib/age-bands";

export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Uncompressed P-256 public key is 65 bytes starting with 0x04. */
export function isValidVapidPublicKey(base64String: string) {
  try {
    const bytes = urlBase64ToUint8Array(base64String.trim());
    return bytes.length === 65 && bytes[0] === 0x04;
  } catch {
    return false;
  }
}

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function isIosDevice() {
  if (typeof window === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return mq || iosStandalone;
}

export function getStoredAgeBand(): AgeBandId | null {
  try {
    const v = localStorage.getItem(AGE_BAND_STORAGE_KEY);
    return isAgeBandId(v) ? v : null;
  } catch {
    return null;
  }
}

export async function registerPushServiceWorker() {
  return navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  });
}

export async function getExistingSubscription() {
  const registration = await registerPushServiceWorker();
  await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function subscribeToPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  if (!publicKey) {
    throw new Error(
      "Trūkst NEXT_PUBLIC_VAPID_PUBLIC_KEY (pārbūvē lietotni pēc Vercel env iestatīšanas).",
    );
  }
  if (!isValidVapidPublicKey(publicKey)) {
    throw new Error(
      "VAPID publiskā atslēga nav derīga P-256 atslēga. Pārbaudi NEXT_PUBLIC_VAPID_PUBLIC_KEY.",
    );
  }

  const registration = await registerPushServiceWorker();
  await navigator.serviceWorker.ready;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Paziņojumu atļauja nav dota.");
  }

  const sub = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  const serialized = JSON.parse(JSON.stringify(sub)) as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subscription: serialized,
      age_band: getStoredAgeBand(),
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Neizdevās saglabāt abonementu.");
  return sub;
}

export async function unsubscribeFromPush() {
  const sub = await getExistingSubscription();
  if (!sub) return;

  const res = await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Neizdevās noņemt abonementu.");

  await sub.unsubscribe();
}

export const PUSH_PROMPT_DISMISSED_KEY = "augt:push_prompt_dismissed";
