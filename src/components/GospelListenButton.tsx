"use client";

import { useEffect, useRef, useState } from "react";

export function GospelListenButton({ audioUrl }: { audioUrl: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audio.preload = "metadata";
    audioRef.current = audio;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);
    const onCanPlay = () => setReady(true);
    const onError = () => {
      setError(true);
      setPlaying(false);
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("error", onError);
      audioRef.current = null;
    };
  }, [audioUrl]);

  async function toggle() {
    const audio = audioRef.current;
    if (!audio || error) return;
    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch {
      setError(true);
    }
  }

  if (error) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!ready && !playing}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3.5 py-1.5 text-sm font-medium text-[var(--bg-deep)] transition hover:bg-[var(--accent)]/20 disabled:opacity-60"
      aria-pressed={playing}
      aria-label={playing ? "Pauzēt klausīšanos" : "Klausīties evaņģēliju"}
    >
      <span aria-hidden className="inline-flex h-4 w-4 items-center justify-center">
        {playing ? (
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current" aria-hidden>
            <rect x="3" y="2" width="3.5" height="12" rx="0.5" />
            <rect x="9.5" y="2" width="3.5" height="12" rx="0.5" />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current" aria-hidden>
            <path d="M4 2.5v11l9-5.5L4 2.5z" />
          </svg>
        )}
      </span>
      {playing ? "Pauzēt" : "Klausīties"}
    </button>
  );
}
