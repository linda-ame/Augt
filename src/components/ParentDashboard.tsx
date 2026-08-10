"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoalPickerModal,
  type GoalCategory,
  type GoalItem,
} from "@/components/GoalPickerModal";
import { BrandLogo } from "@/components/BrandLogo";

type Child = {
  id: string;
  display_name: string;
  age: number;
  active: boolean;
  hasProfile?: boolean;
  todayStatus?: string;
};

export function ParentDashboard({
  family,
  childrenList,
  goals,
  categories,
}: {
  family: { id: string; name: string; family_code: string };
  childrenList: Child[];
  goals: GoalItem[];
  categories: GoalCategory[];
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState(10);
  const [personalCode, setPersonalCode] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [regenChildId, setRegenChildId] = useState<string | null>(null);

  const selectedLabels = useMemo(() => {
    const map = new Map(goals.map((g) => [g.id, g]));
    return selectedGoals
      .map((id) => map.get(id))
      .filter((g): g is GoalItem => Boolean(g));
  }, [goals, selectedGoals]);

  async function addChild(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/children/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          age,
          personalCode,
          goalIds: selectedGoals,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Neizdevās pievienot.");
      if (json.generationError) {
        setMessage(
          `Bērns pievienots. Šodienas satura ģenerēšana neizdevās: ${json.generationError}`,
        );
      } else {
        setMessage("Bērns pievienots. Šodienas saturs tiek / ir ģenerēts.");
      }
      setDisplayName("");
      setPersonalCode("");
      setSelectedGoals([]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setLoading(false);
    }
  }

  async function viewAsChild(childId: string) {
    await fetch("/api/parent/view-child", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId }),
    });
    router.push("/kid");
    router.refresh();
  }

  async function regenerateToday(childId: string, regenerateProfile: boolean) {
    setRegenChildId(childId);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/children/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, regenerateProfile }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Ģenerēšana neizdevās.");
      }
      setMessage("Šodienas saturs veiksmīgi ģenerēts.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setRegenChildId(null);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <BrandLogo href="/" size="md" />
          <p className="mt-1 text-[var(--ink-soft)]">{family.name}</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={logout}>
          Iziet
        </button>
      </header>

      <section className="panel section-enter mt-8 p-6">
        <h2 className="brand-mark text-2xl">Ģimenes kods</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Nodod šo kodu bērniem, lai viņi atrastu ģimeni.
        </p>
        <p className="mt-4 font-mono text-3xl tracking-[0.2em] text-[var(--bg-deep)]">
          {family.family_code}
        </p>
      </section>

      <section className="panel section-enter mt-6 p-6" style={{ animationDelay: "60ms" }}>
        <h2 className="brand-mark text-2xl">Bērni</h2>
        <div className="mt-4 space-y-3">
          {childrenList.length === 0 && (
            <p className="text-[var(--ink-soft)]">Vēl nav pievienotu bērnu.</p>
          )}
          {childrenList.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3"
            >
              <div>
                <p className="font-semibold">{c.display_name}</p>
                <p className="text-sm text-[var(--ink-soft)]">{c.age} gadi</p>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">
                  Šodiena:{" "}
                  {c.todayStatus === "success"
                    ? "gatavs"
                    : c.todayStatus === "failed"
                      ? "neizdevās"
                      : "nav ģenerēts"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={regenChildId === c.id}
                  onClick={() => regenerateToday(c.id, !c.hasProfile)}
                >
                  {regenChildId === c.id
                    ? "Ģenerē…"
                    : c.todayStatus === "success"
                      ? "Ģenerēt no jauna"
                      : "Ģenerēt šodienu"}
                </button>
                <button
                  type="button"
                  className="btn btn-accent"
                  onClick={() => viewAsChild(c.id)}
                >
                  Skatīt kā bērns
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel section-enter mt-6 p-6" style={{ animationDelay: "120ms" }}>
        <h2 className="brand-mark text-2xl">Pievienot bērnu</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Pēc izveides uzreiz tiek ielādēti šodienas Svētie Raksti un ģenerēts
          bērna saturs (nav jāgaida 6:00).
        </p>
        <form onSubmit={addChild} className="mt-5 space-y-4">
          <input
            className="field"
            required
            placeholder="Vārds"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <input
            className="field"
            type="number"
            min={3}
            max={20}
            required
            placeholder="Vecums"
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
          />
          <input
            className="field"
            required
            minLength={4}
            placeholder="Personīgais kods (bērnam ieejai)"
            value={personalCode}
            onChange={(e) => setPersonalCode(e.target.value)}
          />

          <div>
            <label className="text-sm text-[var(--ink-soft)]">Mācību mērķi</label>
            <div className="mt-2 rounded-2xl border border-[var(--line)] bg-white/70 p-4">
              <p className="text-sm text-[var(--ink-soft)]">
                {selectedGoals.length === 0
                  ? "Vēl nav izvēlēts neviens mērķis."
                  : `Izvēlēti ${selectedGoals.length} mērķi`}
              </p>
              {selectedGoals.length > 40 && (
                <p className="mt-2 text-xs text-[var(--accent-deep)]">
                  Ieteikums: 10–40 mērķi ir pietiekami. Ļoti daudz mērķu
                  nepalielina kvalitāti, bet var apgrūtināt ģenerēšanu.
                </p>
              )}
              {selectedLabels.length > 0 && (
                <ul className="mt-3 max-h-28 space-y-1 overflow-y-auto text-sm">
                  {selectedLabels.slice(0, 8).map((g) => (
                    <li key={g.id}>• {g.name}</li>
                  ))}
                  {selectedLabels.length > 8 && (
                    <li className="text-[var(--ink-soft)]">
                      …un vēl {selectedLabels.length - 8}
                    </li>
                  )}
                </ul>
              )}
              <button
                type="button"
                className="btn btn-accent mt-4"
                onClick={() => setPickerOpen(true)}
              >
                Izvēlēties mērķus…
              </button>
            </div>
          </div>

          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Ģenerē profilu un šodienas saturu…" : "Pievienot un ģenerēt šodienu"}
          </button>
        </form>
        {message && <p className="mt-4 text-sm text-[var(--ok)]">{message}</p>}
        {error && <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>}
      </section>

      <GoalPickerModal
        open={pickerOpen}
        goals={goals}
        categories={categories}
        initialSelected={selectedGoals}
        onClose={() => setPickerOpen(false)}
        onSave={(ids) => {
          setSelectedGoals(ids);
          setPickerOpen(false);
        }}
      />
    </main>
  );
}
