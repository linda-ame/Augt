"use client";

import { useEffect, useRef, useState } from "react";

/**
 * iOS / home-screen PWAs often never fire canplay until play() starts,
 * so the button must stay tappable and start playback on the user gesture.
 */
export function GospelListenButton({ audioUrl }: { audioUrl: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const audio = document.createElement("audio");
    audio.preload = "none";
    // iOS inline playback — attribute only (not on HTMLAudioElement typings)
    audio.setAttribute("playsinline", "true");
    audio.setAttribute("webkit-playsinline", "true");
    audio.src = audioUrl;
    audioRef.current = audio;

    const onPlaying = () => {
      setPlaying(true);
      setLoading(false);
      setFailed(false);
    };
    const onPause = () => {
      setPlaying(false);
      setLoading(false);
    };
    const onEnded = () => {
      setPlaying(false);
      setLoading(false);
    };
    const onWaiting = () => setLoading(true);
    const onError = () => {
      setFailed(true);
      setPlaying(false);
      setLoading(false);
    };

    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("error", onError);
      audioRef.current = null;
    };
  }, [audioUrl]);

  async function toggle() {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      return;
    }

    setFailed(false);
    setLoading(true);
    try {
      // Keep play() in the tap gesture path (important on iOS).
      await audio.play();
    } catch {
      setFailed(true);
      setLoading(false);
      setPlaying(false);
    }
  }

  const label = failed
    ? "Mēģināt vēlreiz"
    : loading && !playing
      ? "Ielādē…"
      : playing
        ? "Pauzēt"
        : "Klausīties";

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3.5 py-1.5 text-sm font-medium text-[var(--bg-deep)] transition hover:bg-[var(--accent)]/20 active:bg-[var(--accent)]/25"
      aria-pressed={playing}
      aria-busy={loading && !playing}
      aria-label={
        failed
          ? "Neizdevās atskaņot. Mēģināt vēlreiz"
          : playing
            ? "Pauzēt klausīšanos"
            : "Klausīties evaņģēliju"
      }
    >
      <span aria-hidden className="inline-flex h-4 w-4 items-center justify-center">
        {playing ? (
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current">
            <rect x="3" y="2" width="3.5" height="12" rx="0.5" />
            <rect x="9.5" y="2" width="3.5" height="12" rx="0.5" />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current">
            <path d="M4 2.5v11l9-5.5L4 2.5z" />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}
