"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

const MIN_PIN_LENGTH = 4;

type Mode = "create" | "unlock";

export function ParentGateDialog({
  open,
  mode,
  busy = false,
  error = null,
  onClose,
  onSubmit,
  onForgot,
}: {
  open: boolean;
  mode: Mode;
  busy?: boolean;
  error?: string | null;
  onClose?: () => void;
  onSubmit: (pin: string) => void | Promise<void>;
  onForgot?: () => void | Promise<void>;
}) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setPin("");
    setConfirm("");
    setLocalError(null);
  }, [open, mode]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy && onClose) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, busy, onClose]);

  if (!open || !mounted) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    const value = pin.trim();
    if (value.length < MIN_PIN_LENGTH) {
      setLocalError(`Kods jābūt vismaz ${MIN_PIN_LENGTH} simboliem.`);
      return;
    }
    if (mode === "create") {
      if (value !== confirm.trim()) {
        setLocalError("Kodi nesakrīt.");
        return;
      }
    }
    await onSubmit(value);
  }

  const title =
    mode === "create" ? "Izveido atgriešanās kodu" : "Atgriešanās kods";
  const description =
    mode === "create"
      ? "Lai no bērna profila atgrieztos vecāku profilā, vajadzēs šo kodu. Neizmanto bērna personīgo kodu."
      : "Ievadi kodu, lai atvērtu vecāku profilu.";

  return createPortal(
    <div
      data-augt-parent-gate
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[var(--bg-deep)]/40 backdrop-blur-[2px]"
        aria-label="Aizvērt"
        disabled={busy || !onClose}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--bg-cream)] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="brand-mark text-2xl text-[var(--bg-deep)]">
          {title}
        </h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">{description}</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input
            className="field"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            required
            minLength={MIN_PIN_LENGTH}
            placeholder={mode === "create" ? "Jauns kods" : "Kods"}
            value={pin}
            disabled={busy}
            onChange={(e) => setPin(e.target.value)}
          />
          {mode === "create" ? (
            <input
              className="field"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              required
              minLength={MIN_PIN_LENGTH}
              placeholder="Atkārto kodu"
              value={confirm}
              disabled={busy}
              onChange={(e) => setConfirm(e.target.value)}
            />
          ) : null}

          {(localError || error) && (
            <p className="text-sm text-[var(--danger)]" role="alert">
              {localError || error}
            </p>
          )}

          <button type="submit" className="btn btn-primary w-full" disabled={busy}>
            {busy
              ? "Gaida…"
              : mode === "create"
                ? "Saglabāt un turpināt"
                : "Atvērt vecāku profilu"}
          </button>
        </form>

        {mode === "unlock" && onForgot ? (
          <button
            type="button"
            className="mt-3 w-full text-center text-sm font-medium text-[var(--ink-soft)] underline-offset-2 hover:underline"
            disabled={busy}
            onClick={() => onForgot()}
          >
            Aizmirsu kodu — iziet un ienākt no jauna
          </button>
        ) : null}

        {mode === "create" && onClose ? (
          <button
            type="button"
            className="btn btn-secondary mt-3 w-full"
            disabled={busy}
            onClick={onClose}
          >
            Atcelt
          </button>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
