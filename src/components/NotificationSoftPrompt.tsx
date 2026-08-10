"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PUSH_PROMPT_DISMISSED_KEY,
  getExistingSubscription,
  isIosDevice,
  isPushSupported,
  isStandaloneDisplay,
  subscribeToPush,
} from "@/lib/push-client";

export function NotificationSoftPrompt() {
  const [visible, setVisible] = useState(false);
  const [needInstall, setNeedInstall] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        if (localStorage.getItem(PUSH_PROMPT_DISMISSED_KEY) === "1") return;
      } catch {
        /* ignore */
      }

      const ios = isIosDevice();
      const standalone = isStandaloneDisplay();

      if (!isPushSupported()) {
        if (ios && !standalone) {
          if (!cancelled) {
            setNeedInstall(true);
            setVisible(true);
          }
        }
        return;
      }

      if (Notification.permission === "granted") {
        try {
          const sub = await getExistingSubscription();
          if (sub || cancelled) return;
        } catch {
          /* show prompt */
        }
      }

      if (Notification.permission === "denied") return;

      if (ios && !standalone) {
        if (!cancelled) {
          setNeedInstall(true);
          setVisible(true);
        }
        return;
      }

      if (!cancelled) setVisible(true);
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(PUSH_PROMPT_DISMISSED_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  async function enable() {
    setLoading(true);
    setError(null);
    try {
      await subscribeToPush();
      dismiss();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neizdevās ieslēgt.");
    } finally {
      setLoading(false);
    }
  }

  if (!visible) return null;

  return (
    <section className="panel section-enter mt-6 p-5">
      <h2 className="brand-mark text-xl text-[var(--bg-deep)]">
        Rīta atgādinājums?
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
        Augt katru rītu var atsūtīt dienas tēmu un citātu.
      </p>

      {needInstall ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/kid/settings" className="btn btn-primary text-sm">
            Kā ieslēgt
          </Link>
          <button
            type="button"
            className="btn btn-secondary text-sm"
            onClick={dismiss}
          >
            Vēlāk
          </button>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-primary text-sm"
            disabled={loading}
            onClick={() => void enable()}
          >
            {loading ? "Gaida…" : "Ieslēgt"}
          </button>
          <button
            type="button"
            className="btn btn-secondary text-sm"
            onClick={dismiss}
            disabled={loading}
          >
            Vēlāk
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}
    </section>
  );
}
