"use client";

import { useEffect, useState } from "react";
import {
  getExistingSubscription,
  isIosDevice,
  isPushSupported,
  isStandaloneDisplay,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push-client";

type Status =
  | "loading"
  | "unsupported"
  | "need_install"
  | "off"
  | "on"
  | "denied";

export function NotificationsSettingsClient() {
  const [status, setStatus] = useState<Status>("loading");
  const [ios, setIos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const onIos = isIosDevice();
      const standalone = isStandaloneDisplay();
      if (cancelled) return;
      setIos(onIos);

      if (!isPushSupported()) {
        setStatus(onIos && !standalone ? "need_install" : "unsupported");
        return;
      }

      if (onIos && !standalone) {
        setStatus("need_install");
        return;
      }

      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }

      try {
        const sub = await getExistingSubscription();
        if (cancelled) return;
        setStatus(sub ? "on" : "off");
      } catch {
        if (!cancelled) setStatus("off");
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await subscribeToPush();
      setStatus("on");
      setMessage("Paziņojumi ieslēgti. Katru rītu saņemsi dienas tēmu un citātu.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Kļūda";
      if (Notification.permission === "denied") setStatus("denied");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function disable() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await unsubscribeFromPush();
      setStatus("off");
      setMessage("Paziņojumi izslēgti.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-8">
      <section className="panel section-enter p-6">
        <h1 className="brand-mark text-3xl text-[var(--bg-deep)]">Paziņojumi</h1>
        <p className="mt-3 leading-relaxed text-[var(--ink-soft)]">
          Katru rītu Augt atsūtīs šodienas tēmu un citātu — bez konta, uz šo
          ierīci.
        </p>

        {status === "loading" && (
          <p className="mt-6 text-sm text-[var(--ink-soft)]">Pārbauda…</p>
        )}

        {status === "unsupported" && (
          <p className="mt-6 text-sm text-[var(--ink-soft)]">
            Šajā pārlūkā paziņojumi netiek atbalstīti. Mēģini Chrome / Safari
            jaunāku versiju.
          </p>
        )}

        {status === "need_install" && (
          <div className="mt-6 space-y-3 text-sm leading-relaxed text-[var(--ink)]">
            <p className="font-medium text-[var(--bg-deep)]">
              Vispirms pievieno Augt Home Screen
            </p>
            <ol className="list-decimal space-y-2 pl-5 text-[var(--ink-soft)]">
              <li>
                Safari: Share (kopīgot) →{" "}
                <span className="text-[var(--ink)]">Add to Home Screen</span>
              </li>
              <li>Atver Augt no jaunās ikonas (ne no Safari cilnes)</li>
              <li>Atgriezies šeit un ieslēdz paziņojumus</li>
            </ol>
          </div>
        )}

        {status === "denied" && (
          <p className="mt-6 text-sm text-[var(--danger)]">
            Paziņojumi ir bloķēti sistēmas iestatījumos. Ieslēdz tos Augt
            lietotnei un mēģini vēlreiz.
          </p>
        )}

        {(status === "off" || status === "on") && (
          <label className="mt-6 flex items-center justify-between gap-4">
            <span className="text-[var(--ink)]">
              Rīta paziņojumi
              <span className="mt-1 block text-sm text-[var(--ink-soft)]">
                {status === "on"
                  ? "Ieslēgti šajā ierīcē."
                  : "Izslēgti — spied, lai atļautu."}
              </span>
            </span>
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={status === "on"}
              disabled={loading}
              onChange={(e) => {
                if (e.target.checked) void enable();
                else void disable();
              }}
            />
          </label>
        )}

        {ios && status !== "need_install" && status !== "loading" && (
          <p className="mt-4 text-xs leading-relaxed text-[var(--ink-soft)]">
            iPhone: paziņojumi strādā tikai no Home Screen ikonas (iOS 16.4+).
          </p>
        )}

        {message && (
          <p className="mt-4 text-sm text-[var(--ok)]">{message}</p>
        )}
        {error && (
          <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>
        )}
      </section>
    </main>
  );
}
