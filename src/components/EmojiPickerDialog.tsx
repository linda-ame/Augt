"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AVATAR_EMOJI_GROUPS } from "@/lib/avatar-emojis";

export function EmojiPickerDialog({
  open,
  currentEmoji,
  busy = false,
  onClose,
  onPick,
}: {
  open: boolean;
  currentEmoji: string | null;
  busy?: boolean;
  onClose: () => void;
  onPick: (emoji: string) => void | Promise<void>;
}) {
  const [selected, setSelected] = useState<string | null>(currentEmoji);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) setSelected(currentEmoji);
  }, [open, currentEmoji]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, busy, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      data-augt-emoji-dialog
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[var(--bg-deep)]/40 backdrop-blur-[2px]"
        aria-label="Aizvērt"
        disabled={busy}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="emoji-picker-title"
        className="relative z-10 flex max-h-[min(85vh,36rem)] w-full max-w-md flex-col rounded-2xl border border-[var(--line)] bg-[var(--bg-cream)] p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <h2
          id="emoji-picker-title"
          className="brand-mark text-2xl text-[var(--bg-deep)]"
        >
          Izvēlies emoji
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Šis būs tavs profila attēls.
        </p>

        <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1">
          {AVATAR_EMOJI_GROUPS.map((group) => (
            <div key={group.id}>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-deep)]">
                {group.name}
              </p>
              <div className="mt-2 grid grid-cols-6 gap-1.5">
                {group.emojis.map((emoji) => {
                  const active = emoji === selected;
                  return (
                    <button
                      key={`${group.id}-${emoji}`}
                      type="button"
                      aria-pressed={active}
                      disabled={busy}
                      onClick={() => setSelected(emoji)}
                      className={`flex aspect-square items-center justify-center rounded-xl text-2xl transition ${
                        active
                          ? "bg-[var(--bg-soft)] ring-2 ring-[var(--bg-deep)]"
                          : "bg-white/70 border border-[var(--line)] hover:bg-[var(--bg-soft)]"
                      }`}
                    >
                      <span aria-hidden>{emoji}</span>
                      <span className="sr-only">Izvēlēties {emoji}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            className="btn btn-primary w-full"
            disabled={!selected || busy}
            onClick={() => {
              if (selected) void onPick(selected);
            }}
          >
            {busy ? "Saglabā…" : "Lietot šo emoji"}
          </button>
          <button
            type="button"
            className="btn btn-secondary w-full"
            disabled={busy}
            onClick={onClose}
          >
            Atcelt
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
