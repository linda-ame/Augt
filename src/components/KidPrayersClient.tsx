"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  getPrayerBook,
  type PrayerBookItem,
} from "@/lib/prayer-book";
import type { ChildPrayerRow } from "@/app/api/kid/prayers/route";

type TabId = string; // book category id OR "manas"

export function KidPrayersClient({
  canUseMyPrayers,
  initialMyPrayers,
}: {
  canUseMyPrayers: boolean;
  initialMyPrayers: ChildPrayerRow[];
}) {
  const search = useSearchParams();
  const book = useMemo(() => getPrayerBook(), []);
  const catParam = search.get("cat");
  const idParam = search.get("id");

  const tabs = useMemo(() => {
    const base = book.map((c) => ({ id: c.id, title: c.title }));
    if (!canUseMyPrayers) return base;
    return [...base, { id: "manas", title: "Manas lūgšanas" }];
  }, [book, canUseMyPrayers]);

  const initialCat =
    tabs.find((c) => c.id === catParam)?.id ?? book[0]?.id ?? "pamata";

  const [catId, setCatId] = useState<TabId>(initialCat);
  const [myPrayers, setMyPrayers] = useState(initialMyPrayers);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const category = book.find((c) => c.id === catId);
  const isManas = canUseMyPrayers && catId === "manas";

  useEffect(() => {
    if (catParam === "manas") {
      if (canUseMyPrayers) {
        setCatId("manas");
      } else {
        setCatId(book[0]?.id ?? "pamata");
      }
      return;
    }
    const nextCat = book.find((c) => c.id === catParam)?.id;
    if (nextCat) setCatId(nextCat);
  }, [catParam, book, canUseMyPrayers]);

  useEffect(() => {
    if (!canUseMyPrayers && catId === "manas") {
      setCatId(book[0]?.id ?? "pamata");
    }
  }, [canUseMyPrayers, catId, book]);

  useEffect(() => {
    if (isManas) {
      if (idParam && myPrayers.some((p) => p.id === idParam)) {
        setOpenId(idParam);
      } else {
        setOpenId(myPrayers[0]?.id ?? null);
      }
      return;
    }
    if (!category) return;
    if (idParam && category.items.some((i) => i.id === idParam)) {
      setOpenId(idParam);
    } else {
      setOpenId(category.items[0]?.id ?? null);
    }
  }, [idParam, category, isManas, myPrayers]);

  function selectCategory(id: TabId) {
    setCatId(id);
    setError(null);
    setShowForm(false);
    if (id === "manas") {
      setOpenId(myPrayers[0]?.id ?? null);
      return;
    }
    const next = book.find((c) => c.id === id);
    setOpenId(next?.items[0]?.id ?? null);
  }

  async function addPrayer(e: React.FormEvent) {
    e.preventDefault();
    if (!canUseMyPrayers) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/kid/prayers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Neizdevās saglabāt.");
      const prayer = json.prayer as ChildPrayerRow;
      setMyPrayers((prev) => [prayer, ...prev]);
      setTitle("");
      setBody("");
      setShowForm(false);
      setOpenId(prayer.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setBusy(false);
    }
  }

  async function removePrayer(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/kid/prayers/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Neizdevās dzēst.");
      setMyPrayers((prev) => {
        const next = prev.filter((p) => p.id !== id);
        if (openId === id) setOpenId(next[0]?.id ?? null);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setDeletingId(null);
    }
  }

  async function savePrayerEdit(
    id: string,
    next: { title: string; body: string },
  ) {
    setError(null);
    const res = await fetch(`/api/kid/prayers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || "Neizdevās saglabāt.");
    const prayer = json.prayer as ChildPrayerRow;
    setMyPrayers((prev) => prev.map((p) => (p.id === id ? prayer : p)));
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-8 pb-28">
      <p className="text-[var(--ink-soft)]">
        {canUseMyPrayers
          ? "Mācāmies un skaitām kopā — klasiskās lūgšanas un tavas personīgās."
          : "Mācāmies un skaitām kopā — klasiskās lūgšanas vienā vietā."}
      </p>

      <div
        className="mt-5 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Lūgšanu grupas"
      >
        {tabs.map((cat) => {
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

      {error ? (
        <p className="mt-4 text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}

      {isManas ? (
        <div className="mt-5 space-y-3">
              {!showForm ? (
                <button
                  type="button"
                  className="btn btn-secondary inline-flex items-center gap-2"
                  onClick={() => setShowForm(true)}
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M12 5v14M5 12h14"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  Pievienot lūgšanu
                </button>
              ) : (
                <form
                  onSubmit={addPrayer}
                  className="space-y-3 rounded-2xl border border-[var(--line)] bg-white/70 p-4"
                >
                  <h2 className="brand-mark text-xl text-[var(--bg-deep)]">
                    Jauna lūgšana
                  </h2>
                  <input
                    className="field"
                    required
                    minLength={2}
                    maxLength={120}
                    placeholder="Nosaukums"
                    value={title}
                    disabled={busy}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <textarea
                    className="field min-h-[140px]"
                    required
                    minLength={4}
                    maxLength={5000}
                    placeholder="Lūgšanas teksts…"
                    value={body}
                    disabled={busy}
                    onChange={(e) => setBody(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={busy}
                    >
                      {busy ? "Saglabā…" : "Saglabāt"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={busy}
                      onClick={() => {
                        setShowForm(false);
                        setTitle("");
                        setBody("");
                        setError(null);
                      }}
                    >
                      Atcelt
                    </button>
                  </div>
                </form>
              )}

              {myPrayers.length === 0 && !showForm ? (
                <p className="text-[var(--ink-soft)]">
                  Vēl nav tavu lūgšanu. Pievieno to, ko gribi teikt Dievam saviem
                  vārdiem.
                </p>
              ) : null}

              {myPrayers.map((prayer) => (
                <MyPrayerPanel
                  key={prayer.id}
                  prayer={prayer}
                  open={openId === prayer.id}
                  busy={deletingId === prayer.id}
                  onToggle={() =>
                    setOpenId(openId === prayer.id ? null : prayer.id)
                  }
                  onDelete={() => removePrayer(prayer.id)}
                  onSave={(next) => savePrayerEdit(prayer.id, next)}
                />
              ))}
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {(category?.items ?? []).map((prayer) => (
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
      )}

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

function MyPrayerPanel({
  prayer,
  open,
  busy,
  onToggle,
  onDelete,
  onSave,
}: {
  prayer: ChildPrayerRow;
  open: boolean;
  busy: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onSave: (next: { title: string; body: string }) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(prayer.title);
  const [editBody, setEditBody] = useState(prayer.body);
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setEditing(false);
      setLocalError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!editing) {
      setEditTitle(prayer.title);
      setEditBody(prayer.body);
    }
  }, [prayer.title, prayer.body, editing]);

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setLocalError(null);
    try {
      await onSave({ title: editTitle, body: editBody });
      setEditing(false);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel overflow-hidden">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="brand-mark block text-xl text-[var(--bg-deep)]">
          {prayer.title}
        </span>
        <span className="text-[var(--ink-soft)]">{open ? "▴" : "▾"}</span>
      </button>
      {open ? (
        <div className="space-y-3 border-t border-[var(--line)] px-5 py-4">
          {editing ? (
            <form onSubmit={submitEdit} className="space-y-3">
              <input
                className="field"
                required
                minLength={2}
                maxLength={120}
                value={editTitle}
                disabled={saving || busy}
                onChange={(e) => setEditTitle(e.target.value)}
              />
              <textarea
                className="field min-h-[140px]"
                required
                minLength={4}
                maxLength={5000}
                value={editBody}
                disabled={saving || busy}
                onChange={(e) => setEditBody(e.target.value)}
              />
              {localError ? (
                <p className="text-sm text-[var(--danger)]" role="alert">
                  {localError}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="btn btn-primary !px-3 !py-1.5 text-sm"
                  disabled={saving || busy}
                >
                  {saving ? "Saglabā…" : "Saglabāt"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary !px-3 !py-1.5 text-sm"
                  disabled={saving || busy}
                  onClick={() => {
                    setEditing(false);
                    setEditTitle(prayer.title);
                    setEditBody(prayer.body);
                    setLocalError(null);
                  }}
                >
                  Atcelt
                </button>
              </div>
            </form>
          ) : (
            <>
              <p className="whitespace-pre-wrap leading-relaxed text-[var(--ink)]">
                {prayer.body}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-secondary inline-flex items-center gap-1.5 !px-3 !py-1.5 text-sm"
                  disabled={busy}
                  onClick={() => {
                    setEditTitle(prayer.title);
                    setEditBody(prayer.body);
                    setEditing(true);
                    setLocalError(null);
                  }}
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M4 20h4.5L19 9.5a2.1 2.1 0 0 0 0-3L17.5 5a2.1 2.1 0 0 0-3 0L4 15.5V20Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <path
                      d="m13.5 6.5 4 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  Labot
                </button>
                <button
                  type="button"
                  className="btn btn-secondary !px-3 !py-1.5 text-sm"
                  disabled={busy}
                  onClick={onDelete}
                >
                  {busy ? "Dzēš…" : "Dzēst"}
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
