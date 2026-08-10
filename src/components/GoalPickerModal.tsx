"use client";

import { useEffect, useMemo, useState } from "react";

export type GoalItem = {
  id: string;
  name: string;
  category: string;
  category_id?: string;
};

export type GoalCategory = {
  id: string;
  name: string;
};

type MobileStep = "categories" | "goals";

export function GoalPickerModal({
  open,
  goals,
  categories,
  initialSelected,
  onClose,
  onSave,
}: {
  open: boolean;
  goals: GoalItem[];
  categories: GoalCategory[];
  initialSelected: string[];
  onClose: () => void;
  onSave: (ids: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [mobileStep, setMobileStep] = useState<MobileStep>("categories");

  useEffect(() => {
    if (open) {
      setSelected(initialSelected);
      setQuery("");
      setMobileStep("categories");
      if (categories[0]?.id) setActiveCategory(categories[0].id);
    }
  }, [open, initialSelected, categories]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const g of goals) {
      const cid = g.category_id || g.category;
      map.set(cid, (map.get(cid) || 0) + 1);
    }
    return map;
  }, [goals]);

  const selectedInCategory = useMemo(() => {
    const map = new Map<string, number>();
    const byId = new Map(goals.map((g) => [g.id, g]));
    for (const id of selected) {
      const g = byId.get(id);
      if (!g) continue;
      const cid = g.category_id || g.category;
      map.set(cid, (map.get(cid) || 0) + 1);
    }
    return map;
  }, [selected, goals]);

  const searching = query.trim().length > 0;
  const activeCategoryName =
    categories.find((c) => c.id === activeCategory)?.name ?? "";

  const visibleGoals = useMemo(() => {
    const q = query.trim().toLowerCase();
    return goals.filter((g) => {
      if (q) {
        return (
          g.name.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q)
        );
      }
      const cid = g.category_id || "";
      return cid === activeCategory || g.category === activeCategory;
    });
  }, [goals, activeCategory, query]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function openCategory(id: string) {
    setActiveCategory(id);
    setQuery("");
    setMobileStep("goals");
  }

  const categoryGoalIds = useMemo(() => {
    if (searching) {
      return visibleGoals.map((g) => g.id);
    }
    return goals
      .filter(
        (g) =>
          g.category_id === activeCategory || g.category === activeCategory,
      )
      .map((g) => g.id);
  }, [goals, activeCategory, searching, visibleGoals]);

  const allCategorySelected =
    categoryGoalIds.length > 0 &&
    categoryGoalIds.every((id) => selected.includes(id));

  function toggleAllInView() {
    setSelected((prev) => {
      if (allCategorySelected) {
        const remove = new Set(categoryGoalIds);
        return prev.filter((id) => !remove.has(id));
      }
      const next = new Set(prev);
      for (const id of categoryGoalIds) next.add(id);
      return Array.from(next);
    });
  }

  if (!open) return null;

  const categoryList = (
    <nav className="space-y-2 p-4 sm:p-3">
      {categories.map((cat) => {
        const active = !searching && activeCategory === cat.id;
        const picked = selectedInCategory.get(cat.id) || 0;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => openCategory(cat.id)}
            className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition sm:rounded-xl sm:px-3 sm:py-2.5 ${
              active
                ? "border-transparent bg-[var(--bg-deep)] text-white"
                : "border-[var(--line)] bg-white text-[var(--ink)]"
            }`}
          >
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold leading-snug sm:text-sm">
                {cat.name}
              </span>
              <span
                className={`mt-0.5 block text-xs ${
                  active ? "text-white/80" : "text-[var(--ink-soft)]"
                }`}
              >
                {counts.get(cat.id) || 0} mērķi
                {picked > 0 ? ` · ${picked} izvēlēti` : ""}
              </span>
            </span>
            <span
              className={`shrink-0 text-lg sm:hidden ${
                active ? "text-white/80" : "text-[var(--ink-soft)]"
              }`}
              aria-hidden
            >
              ›
            </span>
          </button>
        );
      })}
    </nav>
  );

  const goalsList = (
    <div className="space-y-2 p-4 sm:p-5">
      {searching && (
        <p className="mb-1 text-sm text-[var(--ink-soft)]">
          Meklēšanas rezultāti: {visibleGoals.length}
        </p>
      )}
      {!searching && (
        <h3 className="mb-2 hidden font-semibold text-[var(--bg-deep)] sm:block">
          {activeCategoryName}
        </h3>
      )}

      {categoryGoalIds.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--line)] bg-white/70 px-3 py-2.5">
          <p className="text-xs text-[var(--ink-soft)] sm:text-sm">
            {searching
              ? `${visibleGoals.length} rezultāti`
              : `${categoryGoalIds.length} mērķi šajā sadaļā`}
            {allCategorySelected ? " · visi atzīmēti" : ""}
          </p>
          <button
            type="button"
            className="btn btn-secondary px-3 py-2 text-sm"
            onClick={toggleAllInView}
          >
            {allCategorySelected
              ? searching
                ? "Noņemt rezultātus"
                : "Noņemt sadaļu"
              : searching
                ? "Atzīmēt rezultātus"
                : "Atzīmēt visus sadaļā"}
          </button>
        </div>
      )}

      {visibleGoals.map((g) => (
        <label
          key={g.id}
          className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--line)] bg-white px-3 py-3.5 text-[15px] sm:py-3 sm:text-sm"
        >
          <input
            type="checkbox"
            className="mt-1 h-4 w-4"
            checked={selected.includes(g.id)}
            onChange={() => toggle(g.id)}
          />
          <span>
            <span className="font-medium leading-snug">{g.name}</span>
            {searching && (
              <span className="mt-0.5 block text-xs text-[var(--ink-soft)]">
                {g.category}
              </span>
            )}
          </span>
        </label>
      ))}
      {visibleGoals.length === 0 && (
        <p className="text-[var(--ink-soft)]">Nekas nav atrasts.</p>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Mācību mērķu izvēle"
      onClick={onClose}
    >
      <div
        className="flex h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-[var(--bg-cream)] shadow-2xl sm:h-[85vh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="border-b border-[var(--line)] px-4 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {/* Mobile: show back when inside a category */}
              <div className="sm:hidden">
                {mobileStep === "goals" && !searching ? (
                  <button
                    type="button"
                    className="mb-2 text-sm font-medium text-[var(--bg-deep)]"
                    onClick={() => setMobileStep("categories")}
                  >
                    ← Visas sadaļas
                  </button>
                ) : null}
                <h2 className="brand-mark text-xl leading-tight text-[var(--bg-deep)]">
                  {mobileStep === "goals" && !searching
                    ? activeCategoryName
                    : "Mācību mērķi"}
                </h2>
              </div>
              <div className="hidden sm:block">
                <h2 className="brand-mark text-2xl text-[var(--bg-deep)]">
                  Mācību mērķi
                </h2>
              </div>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">
                {mobileStep === "categories" && !searching
                  ? "Izvēlies sadaļu"
                  : "Atzīmē mērķus un saglabā"}
                {" · "}
                Izvēlēti: <strong>{selected.length}</strong>
              </p>
            </div>
            <button type="button" className="btn btn-secondary shrink-0" onClick={onClose}>
              Aizvērt
            </button>
          </div>
          <input
            className="field mt-3"
            placeholder="Meklēt visās sadaļās…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim()) setMobileStep("goals");
            }}
          />
        </header>

        {/* Mobile: one step at a time */}
        <div className="min-h-0 flex-1 overflow-y-auto sm:hidden">
          {searching || mobileStep === "goals" ? goalsList : categoryList}
        </div>

        {/* Desktop: side by side, categories scroll vertically */}
        <div className="hidden min-h-0 flex-1 sm:flex">
          <aside className="w-72 shrink-0 overflow-y-auto border-r border-[var(--line)]">
            {categoryList}
          </aside>
          <div className="min-h-0 flex-1 overflow-y-auto">{goalsList}</div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-[var(--line)] bg-white/80 px-4 py-3 sm:px-5 sm:py-4">
          <p className="text-sm text-[var(--ink-soft)]">
            <strong>{selected.length}</strong> izvēlēti
          </p>
          <div className="flex gap-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Atcelt
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onSave(selected)}
            >
              Saglabāt
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
