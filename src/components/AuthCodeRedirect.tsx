"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Catches email-confirm redirects that land on /?code=... before Site URL is updated. */
export function AuthCodeRedirect() {
  const router = useRouter();

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    if (code || error) {
      const next = new URL("/auth/callback", window.location.origin);
      url.searchParams.forEach((value, key) => next.searchParams.set(key, value));
      if (!next.searchParams.get("next")) next.searchParams.set("next", "/parent");
      router.replace(next.pathname + next.search);
    }
  }, [router]);

  return null;
}
