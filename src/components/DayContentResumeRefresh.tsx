"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { todayInRiga } from "@/lib/dates";

/**
 * Home-screen / PWA resume: refresh day content only when still needed.
 * - Calendar day rolled while viewing "today" → go to new today
 * - Today's lesson not ready yet → soft refresh (picks up cron-filled content)
 * - Today's lesson already loaded successfully → do nothing that day
 */
export function DayContentResumeRefresh({
  date,
  contentReady,
}: {
  date: string;
  contentReady: boolean;
}) {
  const router = useRouter();
  const dateRef = useRef(date);
  const readyRef = useRef(contentReady);
  /** True if this screen was opened as the calendar "today" view. */
  const isTodayViewRef = useRef(date === todayInRiga());

  useEffect(() => {
    dateRef.current = date;
    readyRef.current = contentReady;
    isTodayViewRef.current = date === todayInRiga();
  }, [date, contentReady]);

  useEffect(() => {
    let lastAt = 0;

    function maybeRefresh() {
      const now = Date.now();
      if (now - lastAt < 4000) return;
      if (!isTodayViewRef.current) return;

      const today = todayInRiga();
      const viewed = dateRef.current;

      if (viewed !== today) {
        lastAt = now;
        router.replace(`/kid?date=${today}`);
        return;
      }

      if (!readyRef.current) {
        lastAt = now;
        router.refresh();
      }
    }

    function onVisibility() {
      if (document.visibilityState === "visible") maybeRefresh();
    }

    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) maybeRefresh();
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [router]);

  return null;
}
