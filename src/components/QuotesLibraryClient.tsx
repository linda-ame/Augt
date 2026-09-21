"use client";

import { useState } from "react";
import Link from "next/link";
import { displayQuoteSource } from "@/components/SaveQuoteControl";
import type { ChildQuoteRow } from "@/app/api/kid/quotes/route";

export function QuotesLibraryClient({
  canUse,
  initialQuotes,
  childName,
}: {
  canUse: boolean;
  initialQuotes: ChildQuoteRow[];
  childName?: string | null;
}) {
  const [quotes, setQuotes] = useState<ChildQuoteRow[]>(initialQuotes);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function remove(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/kid/quotes/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Neizdevās dzēst.");
      setQuotes((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setDeletingId(null);
    }
  }

  if (!canUse) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-8 pb-28">
        <h1 className="brand-mark text-3xl text-[var(--bg-deep)]">Mani citāti</h1>
        <p className="mt-3 text-[var(--ink-soft)]">
          Citātu grāmatiņa ir pieejama, kad esi pieslēdzies kā bērns.{" "}
          <Link href="/login" className="font-semibold underline underline-offset-2">
            Pieslēgties
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-8 pb-28">
      <h1 className="brand-mark text-3xl text-[var(--bg-deep)]">Mani citāti</h1>
      {childName ? (
        <p className="mt-1 text-sm text-[var(--ink-soft)]">{childName}</p>
      ) : null}
      <p className="mt-2 text-sm text-[var(--ink-soft)]">
        Saglabā iezīmētus fragmentus no šodienas lasījumiem. Avots rādās uzreiz;
        precīzie panti var papildināties nedaudz vēlāk.
      </p>

      {error ? (
        <p className="mt-4 text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}

      {quotes.length === 0 ? (
        <p className="mt-8 text-[var(--ink-soft)]">
          Vēl nav citātu. Šodienas skatā pie evaņģēlija vai lasījuma nospied{" "}
          <span className="font-semibold">Citāts</span>.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {quotes.map((q) => (
            <li
              key={q.id}
              className="rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3"
            >
              <p className="leading-relaxed text-[var(--ink)] italic">
                „{q.quote_text}”
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0 text-sm">
                  <p className="font-semibold text-[var(--accent-deep)]">
                    {displayQuoteSource(q)}
                  </p>
                  {q.source_precise &&
                  q.source_precise !== q.source_reference ? (
                    <p className="text-xs text-[var(--ink-soft)]">
                      no {q.source_reference}
                    </p>
                  ) : null}
                  {q.source_label ? (
                    <p className="mt-0.5 truncate text-xs text-[var(--ink-soft)]">
                      {q.source_label}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="btn btn-secondary !px-3 !py-1.5 text-sm"
                  disabled={deletingId === q.id}
                  onClick={() => remove(q.id)}
                >
                  {deletingId === q.id ? "Dzēš…" : "Dzēst"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
