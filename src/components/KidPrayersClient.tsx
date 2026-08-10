"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  getPrayerBook,
  type PrayerBookItem,
} from "@/lib/prayer-book";

export function KidPrayersClient() {
  const search = useSearchParams();
  const book = useMemo(() => getPrayerBook(), []);
  const catParam = search.get("cat");
  const idParam = search.get("id");

  const initialCat =
    book.find((c) => c.id === catParam)?.id ?? book[0]?.id ?? "pamata";

  const [catId, setCatId] = useState(initialCat);
  const category = book.find((c) => c.id === catId) ?? book[0]!;
  const [openId, setOpenId] = useState<string | null>(
    idParam && category.items.some((i) => i.id === idParam)
      ? idParam
      : category.items[0]?.id ?? null,
  );

  useEffect(() => {
    const nextCat = book.find((c) => c.id === catParam)?.id;
    if (nextCat) setCatId(nextCat);
  }, [catParam, book]);

  useEffect(() => {
    if (idParam && category.items.some((i) => i.id === idParam)) {
      setOpenId(idParam);
    }
  }, [idParam, category.items]);

  function selectCategory(id: string) {
    setCatId(id);
    const next = book.find((c) => c.id === id);
    setOpenId(next?.items[0]?.id ?? null);
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <p className="text-[var(--ink-soft)]">
        Mācāmies un skaitām kopā — visas lūgšanas vienā vietā.
      </p>

      <div
        className="mt-5 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Lūgšanu grupas"
      >
        {book.map((cat) => {
          const active = cat.id === catId;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "border-[var(--bg-deep)] bg-[var(--bg-deep)] text-white"
                  : "border-[var(--line)] bg-white/60 text-[var(--ink-soft)]"
              }`}
              onClick={() => selectCategory(cat.id)}
            >
              {cat.title}
            </button>
          );
        })}
      </div>

      <div className="mt-5 space-y-3">
        {category.items.map((prayer) => (
          <PrayerPanel
            key={prayer.id}
            prayer={prayer}
            open={openId === prayer.id}
            onToggle={() =>
              setOpenId(openId === prayer.id ? null : prayer.id)
            }
          />
        ))}
      </div>

      <p className="mt-8 text-sm text-[var(--ink-soft)]">
        Gribi saprast, kas ir lūgšana?{" "}
        <a
          className="font-semibold text-[var(--bg-deep)] underline"
          href="/kid/faith/learn/prayers"
        >
          Mācīties Mana ticībā
        </a>
      </p>
    </main>
  );
}

function PrayerPanel({
  prayer,
  open,
  onToggle,
}: {
  prayer: PrayerBookItem;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <section className="panel overflow-hidden">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span>
          <span className="brand-mark block text-xl text-[var(--bg-deep)]">
            {prayer.title}
          </span>
          {prayer.subtitle ? (
            <span className="mt-1 block text-sm text-[var(--ink-soft)]">
              {prayer.subtitle}
            </span>
          ) : null}
        </span>
        <span className="text-[var(--ink-soft)]">{open ? "▴" : "▾"}</span>
      </button>
      {open ? (
        <div className="border-t border-[var(--line)] px-5 py-4">
          <p className="whitespace-pre-wrap leading-relaxed text-[var(--ink)]">
            {prayer.text}
          </p>
        </div>
      ) : null}
    </section>
  );
}
