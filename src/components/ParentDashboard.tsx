"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import {
  EMPTY_PARENT_NOTES,
  normalizeParentNotes,
  type ParentNotes,
  type ProfileStatus,
} from "@/lib/parent-notes";

type Child = {
  id: string;
  display_name: string;
  age: number;
  active: boolean;
  profileStatus: ProfileStatus;
  profileDraft: string | null;
  generatedProfile: string | null;
  parentNotes: ParentNotes;
  todayStatus?: string;
};

function ParentNotesFields({
  notes,
  onChange,
  disabled,
}: {
  notes: ParentNotes;
  onChange: (next: ParentNotes) => void;
  disabled?: boolean;
}) {
  function setField(key: keyof ParentNotes, value: string) {
    onChange({ ...notes, [key]: value });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-[var(--ink)]">
          Ko īpaši vēlies uzsvērt / attīstīt?
        </label>
        <p className="mt-1 text-xs text-[var(--ink-soft)]">
          Piemēram drosmi, labestību, lūgšanu, atbildību…
        </p>
        <textarea
          className="field mt-2 min-h-[72px]"
          disabled={disabled}
          value={notes.emphasize}
          onChange={(e) => setField("emphasize", e.target.value)}
          placeholder="Brīvi apraksti saviem vārdiem…"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-[var(--ink)]">
          Ar ko ikdienā saskaramies?
        </label>
        <p className="mt-1 text-xs text-[var(--ink-soft)]">
          Situācijas, kurās gribētu atbalstu (bez diagnožu valodas).
        </p>
        <textarea
          className="field mt-2 min-h-[72px]"
          disabled={disabled}
          value={notes.challenges}
          onChange={(e) => setField("challenges", e.target.value)}
          placeholder="Piemēram strīdi, bailes, skola, ekrāni…"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-[var(--ink)]">
          Ko nevēlies, lai AI pieskaras?
        </label>
        <p className="mt-1 text-xs text-[var(--ink-soft)]">
          Robežas — jutīgas tēmas, ģimenes situācijas u.tml.
        </p>
        <textarea
          className="field mt-2 min-h-[64px]"
          disabled={disabled}
          value={notes.boundaries}
          onChange={(e) => setField("boundaries", e.target.value)}
          placeholder="Neobligāti"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-[var(--ink)]">
          Vēl kaut kas?
        </label>
        <p className="mt-1 text-xs text-[var(--ink-soft)]">
          Brīvais lauks — personība, konteksts, kas neiederas augšā.
        </p>
        <textarea
          className="field mt-2 min-h-[64px]"
          disabled={disabled}
          value={notes.other}
          onChange={(e) => setField("other", e.target.value)}
          placeholder="Neobligāti"
        />
      </div>
    </div>
  );
}

function profileStatusLabel(status: ProfileStatus) {
  if (status === "approved") return "profils apstiprināts";
  if (status === "draft") return "gaida apstiprinājumu";
  return "nav profila";
}

export function ParentDashboard({
  family,
  childrenList,
}: {
  family: { id: string; name: string; family_code: string };
  childrenList: Child[];
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState(10);
  const [personalCode, setPersonalCode] = useState("");
  const [createNotes, setCreateNotes] = useState<ParentNotes>(EMPTY_PARENT_NOTES);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [regenChildId, setRegenChildId] = useState<string | null>(null);

  const [editorChildId, setEditorChildId] = useState<string | null>(null);
  const [editorNotes, setEditorNotes] = useState<ParentNotes>(EMPTY_PARENT_NOTES);
  const [editorProfile, setEditorProfile] = useState("");
  const [editorBusy, setEditorBusy] = useState(false);

  const editorChild = childrenList.find((c) => c.id === editorChildId) ?? null;

  useEffect(() => {
    if (!editorChild) return;
    setEditorNotes(normalizeParentNotes(editorChild.parentNotes));
    setEditorProfile(
      editorChild.profileDraft || editorChild.generatedProfile || "",
    );
  }, [editorChild]);

  function openEditor(child: Child) {
    setEditorChildId(child.id);
    setEditorNotes(normalizeParentNotes(child.parentNotes));
    setEditorProfile(child.profileDraft || child.generatedProfile || "");
    setError(null);
    setMessage(null);
  }

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
          parentNotes: createNotes,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Neizdevās pievienot.");
      if (json.draftError) {
        setMessage(
          `Bērns pievienots, bet profila melnraksts neizdevās: ${json.draftError}`,
        );
      } else {
        setMessage(
          "Bērns pievienots. Pārskati AI profilu un apstiprini, lai ģenerētu šodienas saturu.",
        );
      }
      setDisplayName("");
      setPersonalCode("");
      setCreateNotes(EMPTY_PARENT_NOTES);
      if (json.child?.id) {
        setEditorChildId(json.child.id);
        setEditorNotes(normalizeParentNotes(json.child.parent_notes));
        setEditorProfile(json.profileDraft || json.child.profile_draft || "");
      }
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

  async function regenerateToday(childId: string) {
    setRegenChildId(childId);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/children/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId }),
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

  async function generateDraft() {
    if (!editorChildId) return;
    setEditorBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/children/profile/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: editorChildId,
          parentNotes: editorNotes,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Melnraksts neizdevās.");
      }
      setEditorProfile(json.profileDraft || "");
      setMessage("Profila melnraksts gatavs — pārskati un apstiprini.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setEditorBusy(false);
    }
  }

  async function approveProfile() {
    if (!editorChildId) return;
    setEditorBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/children/profile/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: editorChildId,
          profileText: editorProfile,
          generateToday: true,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Apstiprināšana neizdevās.");
      }
      setMessage("Profils apstiprināts. Šodienas saturs tiek / ir ģenerēts.");
      setEditorChildId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setEditorBusy(false);
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
                  {profileStatusLabel(c.profileStatus)} · Šodiena:{" "}
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
                  className="btn btn-secondary"
                  onClick={() => openEditor(c)}
                >
                  Personalizācija
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={regenChildId === c.id || c.profileStatus !== "approved"}
                  onClick={() => regenerateToday(c.id)}
                  title={
                    c.profileStatus !== "approved"
                      ? "Vispirms apstiprini profilu"
                      : undefined
                  }
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

      {editorChild && (
        <section
          className="panel section-enter mt-6 p-6"
          style={{ animationDelay: "90ms" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="brand-mark text-2xl">
                Personalizācija — {editorChild.display_name}
              </h2>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">
                Apraksti bērnu saviem vārdiem. AI izveidos iekšējo profilu — tu to
                pārskati un apstiprini pirms lietošanas.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditorChildId(null)}
            >
              Aizvērt
            </button>
          </div>

          <div className="mt-5">
            <ParentNotesFields
              notes={editorNotes}
              onChange={setEditorNotes}
              disabled={editorBusy}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-accent"
              disabled={editorBusy}
              onClick={generateDraft}
            >
              {editorBusy ? "Ģenerē…" : "Ģenerēt profila melnrakstu"}
            </button>
          </div>

          <div className="mt-6">
            <label className="text-sm font-medium text-[var(--ink)]">
              AI profils (pārskati pirms apstiprināšanas)
            </label>
            <textarea
              className="field mt-2 min-h-[160px]"
              disabled={editorBusy}
              value={editorProfile}
              onChange={(e) => setEditorProfile(e.target.value)}
              placeholder="Šeit parādīsies AI melnraksts…"
            />
          </div>

          <button
            type="button"
            className="btn btn-primary mt-4"
            disabled={editorBusy || !editorProfile.trim()}
            onClick={approveProfile}
          >
            {editorBusy
              ? "Apstiprina…"
              : "Apstiprināt profilu un ģenerēt šodienu"}
          </button>
        </section>
      )}

      <section className="panel section-enter mt-6 p-6" style={{ animationDelay: "120ms" }}>
        <h2 className="brand-mark text-2xl">Pievienot bērnu</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Pēc pievienošanas AI izveidos profila melnrakstu. Tu to apstiprini — tad
          tiek ģenerēts šodienas saturs. Piezīmes nav obligātas; bez tām paliek
          vecuma joslas standarts.
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

          <ParentNotesFields notes={createNotes} onChange={setCreateNotes} disabled={loading} />

          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Pievieno un ģenerē melnrakstu…" : "Pievienot bērnu"}
          </button>
        </form>
      </section>

      {message && <p className="mt-4 text-sm text-[var(--ok)]">{message}</p>}
      {error && <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>}
    </main>
  );
}
