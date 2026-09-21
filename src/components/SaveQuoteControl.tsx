"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import type { ScriptureReading } from "@/lib/types";

function QuoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8.5 17.5c-2.2 0-3.8-1.7-3.8-3.9 0-2.4 1.8-4.5 4.5-6.1l.7 1.2c-1.7 1-2.7 2.2-2.7 3.6 0 .9.5 1.6 1.4 1.6 1.1 0 1.9-.9 1.9-2.1V8.5H5.8V6.2h7.3v5.5c0 3.2-1.9 5.8-4.6 5.8Zm9.2 0c-2.2 0-3.8-1.7-3.8-3.9 0-2.4 1.8-4.5 4.5-6.1l.7 1.2c-1.7 1-2.7 2.2-2.7 3.6 0 .9.5 1.6 1.4 1.6 1.1 0 1.9-.9 1.9-2.1V8.5h-4.7V6.2H22v5.5c0 3.2-1.9 5.8-4.3 5.8Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SaveQuoteControl({
  reading,
  readingDate,
  enabled,
}: {
  reading: ScriptureReading;
  readingDate: string;
  enabled: boolean;
}) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedHint, setSavedHint] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, busy]);

  const captureSelection = useCallback(() => {
    const text = window.getSelection()?.toString().replace(/\s+/g, " ").trim() || "";
    if (text.length >= 8) setSelected(text);
  }, []);

  if (!enabled) return null;

  async function save() {
    const quoteText = selected.trim();
    if (quoteText.length < 8) {
      setError("Iezīmē garāku tekstu (vismaz dažus vārdus).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/kid/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteText,
          sourceReference: reading.reference,
          sourceLabel: reading.label,
          readingRole: reading.role || null,
          readingDate,
          readingText: reading.text,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Neizdevās saglabāt.");
      setSavedHint(`Saglabāts · ${reading.reference}`);
      setOpen(false);
      setSelected("");
      window.setTimeout(() => setSavedHint(null), 4500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn btn-secondary inline-flex items-center gap-1.5 !px-3 !py-1.5 text-sm"
          onClick={() => {
            setError(null);
            setSelected(
              window.getSelection()?.toString().replace(/\s+/g, " ").trim() || "",
            );
            setOpen(true);
          }}
          title="Saglabāt citātu"
        >
          <QuoteIcon className="h-4 w-4" />
          Citāts
        </button>
        {savedHint ? (
          <span className="text-xs font-medium text-[var(--ok)]">
            {savedHint} ·{" "}
            <a href="/kid/quotes" className="underline underline-offset-2">
              Mani citāti
            </a>
          </span>
        ) : null}
      </div>

      {open && mounted
        ? createPortal(
            <div
              data-augt-save-quote
              className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
            >
              <button
                type="button"
                className="absolute inset-0 bg-[var(--bg-deep)]/40 backdrop-blur-[2px]"
                aria-label="Aizvērt"
                disabled={busy}
                onClick={() => setOpen(false)}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="relative z-10 w-full max-w-md rounded-t-2xl border border-[var(--line)] bg-[var(--bg-cream)] p-5 shadow-2xl sm:rounded-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 id={titleId} className="brand-mark text-2xl text-[var(--bg-deep)]">
                  Saglabāt citātu
                </h2>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  Iezīmē tekstu lasījumā, tad nospied «Izmantot iezīmēto». Avots:{" "}
                  <span className="font-medium text-[var(--ink)]">
                    {reading.reference}
                  </span>
                  . Ja iespējams, precizēsim pantus.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary !px-3 !py-1.5 text-sm"
                    disabled={busy}
                    onClick={captureSelection}
                  >
                    Izmantot iezīmēto
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary !px-3 !py-1.5 text-sm"
                    disabled={busy}
                    onClick={() =>
                      setSelected(reading.text.replace(/\s+/g, " ").trim().slice(0, 600))
                    }
                  >
                    Ņemt rindkopu
                  </button>
                </div>

                <textarea
                  className="field mt-3 min-h-[120px]"
                  value={selected}
                  disabled={busy}
                  onChange={(e) => setSelected(e.target.value)}
                  placeholder="Šeit parādīsies iezīmētais teksts…"
                />

                {error ? (
                  <p className="mt-2 text-sm text-[var(--danger)]" role="alert">
                    {error}
                  </p>
                ) : null}

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary flex-1"
                    disabled={busy}
                    onClick={() => setOpen(false)}
                  >
                    Atcelt
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary flex-1"
                    disabled={busy || selected.trim().length < 8}
                    onClick={save}
                  >
                    {busy ? "Saglabā…" : "Saglabāt"}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export function displayQuoteSource(quote: {
  source_precise: string | null;
  source_reference: string;
}): string {
  return quote.source_precise?.trim() || quote.source_reference;
}
