"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { ParentGateDialog } from "@/components/ParentGateDialog";
import {
  EMPTY_PARENT_NOTES,
  normalizeParentNotes,
  parentNotesHaveContent,
  type ParentNotes,
  type ProfileStatus,
} from "@/lib/parent-notes";
import {
  CHILD_DAILY_GENERATION_PAUSED_MESSAGE,
  isChildDailyGenerationEnabled,
} from "@/lib/features";

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

function ParentPanelModal({
  open,
  title,
  description,
  busy = false,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  busy?: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      data-augt-parent-panel
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
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
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(92vh,44rem)] w-full max-w-lg flex-col rounded-t-2xl border border-[var(--line)] bg-[var(--bg-cream)] shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="brand-mark text-2xl text-[var(--bg-deep)]">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-[var(--ink-soft)]">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="btn btn-secondary shrink-0 !px-3 !py-1.5 text-sm"
            disabled={busy}
            onClick={onClose}
          >
            Aizvērt
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function profileStatusLabel(status: ProfileStatus) {
  if (status === "approved") return "profils apstiprināts";
  if (status === "draft") return "gaida apstiprinājumu";
  return "nav profila";
}

function todayStatusMeta(status?: string) {
  if (status === "success") {
    return { label: "Šodiena gatava", className: "text-[var(--ok)]" };
  }
  if (status === "failed") {
    return { label: "Šodiena neizdevās", className: "text-[var(--danger)]" };
  }
  return { label: "Šodiena nav", className: "text-[var(--ink-soft)]" };
}

export function ParentDashboard({
  family,
  childrenList,
  hasParentGatePin,
}: {
  family: { id: string; name: string; family_code: string };
  childrenList: Child[];
  hasParentGatePin: boolean;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState(10);
  const [personalCode, setPersonalCode] = useState("");
  const [createNotes, setCreateNotes] = useState<ParentNotes>(EMPTY_PARENT_NOTES);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const [showCreatePersonalize, setShowCreatePersonalize] = useState(false);
  const [createProfileDraft, setCreateProfileDraft] = useState("");
  const [createDraftBusy, setCreateDraftBusy] = useState(false);

  const [editorChildId, setEditorChildId] = useState<string | null>(null);
  const [editorName, setEditorName] = useState("");
  const [editorAge, setEditorAge] = useState(10);
  const [editorPersonalCode, setEditorPersonalCode] = useState("");
  const [editorNotes, setEditorNotes] = useState<ParentNotes>(EMPTY_PARENT_NOTES);
  const [editorProfile, setEditorProfile] = useState("");
  const [editorBusy, setEditorBusy] = useState(false);
  const [showEditorPersonalize, setShowEditorPersonalize] = useState(false);
  const [regenBusy, setRegenBusy] = useState(false);
  const [regenComment, setRegenComment] = useState("");

  const [gatePinSet, setGatePinSet] = useState(hasParentGatePin);
  const [pendingViewChildId, setPendingViewChildId] = useState<string | null>(null);
  const [gateBusy, setGateBusy] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);

  const childrenSectionRef = useRef<HTMLElement>(null);
  const editorChild = childrenList.find((c) => c.id === editorChildId) ?? null;

  function returnToChildrenList() {
    setShowAddChild(false);
    setEditorChildId(null);
    setShowCreatePersonalize(false);
    setCreateProfileDraft("");
    setShowEditorPersonalize(false);
    requestAnimationFrame(() => {
      childrenSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  useEffect(() => {
    setGatePinSet(hasParentGatePin);
  }, [hasParentGatePin]);

  function openEditor(child: Child) {
    setEditorChildId(child.id);
    setEditorName(child.display_name);
    setEditorAge(child.age);
    setEditorPersonalCode("");
    setEditorNotes(normalizeParentNotes(child.parentNotes));
    setEditorProfile(child.profileDraft || child.generatedProfile || "");
    setShowEditorPersonalize(
      parentNotesHaveContent(child.parentNotes) ||
        Boolean(child.profileDraft || child.generatedProfile),
    );
    setRegenComment("");
    setError(null);
    setMessage(null);
  }

  function resetAddChildForm() {
    setDisplayName("");
    setAge(10);
    setPersonalCode("");
    setCreateNotes(EMPTY_PARENT_NOTES);
    setShowCreatePersonalize(false);
    setCreateProfileDraft("");
    setShowAddChild(false);
  }

  async function generateCreateDraft() {
    setCreateDraftBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/children/profile/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ age, parentNotes: createNotes }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Profila ģenerēšana neizdevās.");
      }
      setCreateProfileDraft(json.profileDraft || "");
      setMessage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setCreateDraftBusy(false);
    }
  }

  async function addChild(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const hasDraft = Boolean(createProfileDraft.trim());
      const res = await fetch("/api/children/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          age,
          personalCode,
          parentNotes: createNotes,
          profileText: hasDraft ? createProfileDraft : undefined,
          approveProfile: hasDraft,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Neizdevās pievienot.");
      if (json.draftError) {
        setMessage(`Bērns pievienots, bet profils: ${json.draftError}`);
      } else if (json.approved) {
        setMessage(
          isChildDailyGenerationEnabled()
            ? "Bērns saglabāts. Profils apstiprināts un šodienas saturs ģenerēts."
            : `Bērns saglabāts. Profils apstiprināts. ${CHILD_DAILY_GENERATION_PAUSED_MESSAGE}`,
        );
      } else {
        setMessage(
          "Bērns pievienots. Personalizāciju vari pievienot vēlāk ar pogu «Labot».",
        );
      }
      resetAddChildForm();
      returnToChildrenList();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setLoading(false);
    }
  }

  async function enterChildView(childId: string) {
    const res = await fetch("/api/parent/view-child", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId, familyId: family.id }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.error || "Neizdevās atvērt bērna skatu.");
    }
    window.location.assign("/kid");
  }

  function viewAsChild(childId: string) {
    setError(null);
    setGateError(null);
    if (!gatePinSet) {
      setPendingViewChildId(childId);
      return;
    }
    void enterChildView(childId).catch((err) => {
      setError(err instanceof Error ? err.message : "Kļūda");
    });
  }

  async function createGatePinAndView(pin: string) {
    if (!pendingViewChildId) return;
    setGateBusy(true);
    setGateError(null);
    try {
      const pinRes = await fetch("/api/parent/gate-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, familyId: family.id }),
      });
      const pinJson = await pinRes.json().catch(() => ({}));
      if (!pinRes.ok) {
        throw new Error(pinJson.error || "Neizdevās saglabāt kodu.");
      }
      setGatePinSet(true);
      const childId = pendingViewChildId;
      setPendingViewChildId(null);
      await enterChildView(childId);
    } catch (err) {
      setGateError(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setGateBusy(false);
    }
  }

  async function saveChildBasics(e: React.FormEvent) {
    e.preventDefault();
    if (!editorChildId) return;
    setEditorBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/children/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: editorChildId,
          displayName: editorName,
          age: editorAge,
          personalCode: editorPersonalCode.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Neizdevās saglabāt.");
      }
      setEditorPersonalCode("");
      setMessage("Bērna dati saglabāti.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setEditorBusy(false);
    }
  }

  async function regenerateToday() {
    if (!editorChildId) return;
    setRegenBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/children/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: editorChildId,
          comment: regenComment.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Ģenerēšana neizdevās.");
      }
      setRegenComment("");
      if (json.paused) {
        setMessage(CHILD_DAILY_GENERATION_PAUSED_MESSAGE);
      } else {
        setMessage(
          regenComment.trim()
            ? "Šodienas saturs ģenerēts no jauna, ņemot vērā tavu komentāru."
            : "Šodienas saturs veiksmīgi ģenerēts.",
        );
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kļūda");
    } finally {
      setRegenBusy(false);
    }
  }

  async function generateDraft() {
    if (!editorChildId) return;
    setEditorBusy(true);
    setError(null);
    setMessage(null);
    try {
      // Persist name/age first so draft uses current age.
      const saveRes = await fetch("/api/children/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: editorChildId,
          displayName: editorName,
          age: editorAge,
          personalCode: editorPersonalCode.trim() || undefined,
        }),
      });
      const saveJson = await saveRes.json();
      if (!saveRes.ok || !saveJson.ok) {
        throw new Error(saveJson.error || "Neizdevās saglabāt datus pirms ģenerēšanas.");
      }
      setEditorPersonalCode("");

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
      const saveRes = await fetch("/api/children/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: editorChildId,
          displayName: editorName,
          age: editorAge,
          personalCode: editorPersonalCode.trim() || undefined,
        }),
      });
      const saveJson = await saveRes.json();
      if (!saveRes.ok || !saveJson.ok) {
        throw new Error(saveJson.error || "Neizdevās saglabāt datus.");
      }
      setEditorPersonalCode("");

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
      setMessage(
        isChildDailyGenerationEnabled()
          ? "Profils apstiprināts. Šodienas saturs tiek / ir ģenerēts."
          : `Profils apstiprināts. ${CHILD_DAILY_GENERATION_PAUSED_MESSAGE}`,
      );
      returnToChildrenList();
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

  const editorModalBusy = editorBusy || regenBusy;
  const addModalBusy = loading || createDraftBusy;

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

      {childrenList.length > 0 ? (
        <section
          className="panel section-enter mt-6 p-6"
          style={{ animationDelay: "40ms" }}
        >
          <h2 className="brand-mark text-2xl">Bērnu saturs</h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Skati dienas lasījumus un personalizēto saturu bez ieiešanas bērna
            profilā.
          </p>
          <a
            href="/parent/content"
            className="btn btn-accent mt-4 inline-flex items-center gap-2"
          >
            Atvērt saturu
          </a>
        </section>
      ) : null}

      <section
        ref={childrenSectionRef}
        className="panel section-enter mt-6 p-6"
        style={{ animationDelay: "60ms" }}
      >
        <h2 className="brand-mark text-2xl">Bērni</h2>
        <div className="mt-4 space-y-2">
          {childrenList.length === 0 && (
            <p className="text-[var(--ink-soft)]">Vēl nav pievienotu bērnu.</p>
          )}
          {childrenList.map((c) => {
            const today = todayStatusMeta(c.todayStatus);
            return (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-white/70 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold leading-tight">
                    {c.display_name}
                    <span className="font-normal text-[var(--ink-soft)]">
                      {" "}
                      · {c.age}
                    </span>
                  </p>
                  <p className={`mt-0.5 text-xs leading-tight ${today.className}`}>
                    {today.label}
                    {c.profileStatus !== "approved" ? (
                      <span className="text-[var(--ink-soft)]">
                        {" "}
                        · {profileStatusLabel(c.profileStatus)}
                      </span>
                    ) : null}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    className="btn btn-secondary inline-flex items-center gap-1.5 !px-3 !py-1.5 text-sm"
                    onClick={() => openEditor(c)}
                  >
                    <svg
                      className="h-4 w-4 shrink-0"
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
                    className="btn btn-accent inline-flex items-center gap-1.5 !px-3 !py-1.5 text-sm"
                    onClick={() => viewAsChild(c.id)}
                    title="Skatīt kā bērns"
                  >
                    <svg
                      className="h-4 w-4 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="2.75"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                    Kā bērns
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="btn btn-secondary mt-4 inline-flex items-center gap-2"
          onClick={() => {
            resetAddChildForm();
            setShowAddChild(true);
            setError(null);
            setMessage(null);
          }}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Pievienot bērnu
        </button>
      </section>

      {message && <p className="mt-4 text-sm text-[var(--ok)]">{message}</p>}
      {error && !editorChild && !showAddChild ? (
        <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>
      ) : null}

      <ParentPanelModal
        open={Boolean(editorChild)}
        title={editorChild ? `Labot — ${editorChild.display_name}` : "Labot"}
        description="Maini pamatdatus un, ja vajag, personalizāciju."
        busy={editorModalBusy}
        onClose={() => {
          if (editorModalBusy) return;
          setEditorChildId(null);
          setError(null);
        }}
      >
        {editorChild ? (
          <div className="space-y-5">
            {error ? (
              <p className="text-sm text-[var(--danger)]" role="alert">
                {error}
              </p>
            ) : null}

            <form onSubmit={saveChildBasics} className="space-y-3">
              <input
                className="field"
                required
                placeholder="Vārds"
                value={editorName}
                disabled={editorModalBusy}
                onChange={(e) => setEditorName(e.target.value)}
              />
              <input
                className="field"
                type="number"
                min={3}
                max={20}
                required
                placeholder="Vecums"
                value={editorAge}
                disabled={editorModalBusy}
                onChange={(e) => setEditorAge(Number(e.target.value))}
              />
              <input
                className="field"
                minLength={4}
                placeholder="Jauns personīgais kods (neobligāti)"
                value={editorPersonalCode}
                disabled={editorModalBusy}
                onChange={(e) => setEditorPersonalCode(e.target.value)}
              />
              <button className="btn btn-primary w-full" disabled={editorModalBusy}>
                {editorBusy ? "Saglabā…" : "Saglabāt datus"}
              </button>
            </form>

            <div className="space-y-3 rounded-2xl border border-[var(--line)] bg-white/50 p-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--bg-deep)]">
                  Šodienas saturs
                </h3>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">
                  {!isChildDailyGenerationEnabled()
                    ? CHILD_DAILY_GENERATION_PAUSED_MESSAGE
                    : editorChild.todayStatus === "success"
                      ? "Šodiena jau ir ģenerēta. Vari ģenerēt no jauna."
                      : editorChild.todayStatus === "failed"
                        ? "Iepriekšējā ģenerēšana neizdevās — mēģini vēlreiz."
                        : "Šodienas individuālais saturs vēl nav ģenerēts."}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--ink)]">
                  Komentārs ģenerēšanai (neobligāti)
                </label>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">
                  Piemēram, kas nepatika vai ko vēlies citādi. AI instrukcijas un
                  ticības vadlīnijas joprojām ir obligātas.
                </p>
                <textarea
                  className="field mt-2 min-h-[72px]"
                  disabled={editorModalBusy}
                  value={regenComment}
                  onChange={(e) => setRegenComment(e.target.value)}
                  placeholder="Piemēram: pārāk sarežģīti; vairāk par drosmi; bez spēles ar skolas piemēru…"
                  maxLength={2000}
                />
              </div>
              <button
                type="button"
                className="btn btn-primary w-full"
                disabled={editorModalBusy}
                onClick={regenerateToday}
              >
                {regenBusy
                  ? "Ģenerē…"
                  : editorChild.todayStatus === "success"
                    ? "Ģenerēt šodienu no jauna"
                    : "Ģenerēt šodienu"}
              </button>
            </div>

            {!showEditorPersonalize ? (
              <button
                type="button"
                className="btn btn-secondary w-full"
                disabled={editorModalBusy}
                onClick={() => setShowEditorPersonalize(true)}
              >
                Personalizēt
              </button>
            ) : (
              <div className="space-y-4 rounded-2xl border border-[var(--line)] bg-white/50 p-4">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--bg-deep)]">
                    Personalizācija
                  </h3>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">
                    Aizpildi vismaz vienu lauku, tad ģenerē AI profilu.
                  </p>
                </div>

                <ParentNotesFields
                  notes={editorNotes}
                  onChange={setEditorNotes}
                  disabled={editorModalBusy}
                />

                <button
                  type="button"
                  className="btn btn-accent w-full"
                  disabled={
                    editorModalBusy || !parentNotesHaveContent(editorNotes)
                  }
                  onClick={generateDraft}
                >
                  {editorBusy
                    ? "Ģenerē…"
                    : editorProfile.trim()
                      ? "Ģenerēt profilu no jauna"
                      : "Izveidot personalizēto profilu"}
                </button>

                {editorProfile.trim() ? (
                  <>
                    <div>
                      <label className="text-sm font-medium text-[var(--ink)]">
                        AI profils — pārskati un labo, ja vajag
                      </label>
                      <textarea
                        className="field mt-2 min-h-[140px]"
                        disabled={editorModalBusy}
                        value={editorProfile}
                        onChange={(e) => setEditorProfile(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary w-full"
                      disabled={editorModalBusy || !editorProfile.trim()}
                      onClick={approveProfile}
                    >
                      {editorBusy
                        ? "Apstiprina…"
                        : "Apstiprināt profilu un ģenerēt šodienu"}
                    </button>
                  </>
                ) : null}
              </div>
            )}
          </div>
        ) : null}
      </ParentPanelModal>

      <ParentPanelModal
        open={showAddChild}
        title="Pievienot bērnu"
        description="Vispirms pamatdati. Personalizācija ir neobligāta."
        busy={addModalBusy}
        onClose={() => {
          if (addModalBusy) return;
          resetAddChildForm();
          setError(null);
        }}
      >
        <form onSubmit={addChild} className="space-y-4">
          {error ? (
            <p className="text-sm text-[var(--danger)]" role="alert">
              {error}
            </p>
          ) : null}
          <input
            className="field"
            required
            placeholder="Vārds"
            value={displayName}
            disabled={addModalBusy}
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
            disabled={addModalBusy}
            onChange={(e) => setAge(Number(e.target.value))}
          />
          <input
            className="field"
            required
            minLength={4}
            placeholder="Personīgais kods (bērnam ieejai)"
            value={personalCode}
            disabled={addModalBusy}
            onChange={(e) => setPersonalCode(e.target.value)}
          />

          {!showCreatePersonalize ? (
            <button
              type="button"
              className="btn btn-secondary w-full"
              disabled={addModalBusy}
              onClick={() => setShowCreatePersonalize(true)}
            >
              Personalizēt
            </button>
          ) : (
            <div className="space-y-4 rounded-2xl border border-[var(--line)] bg-white/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--bg-deep)]">
                    Personalizācija
                  </h3>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">
                    Aizpildi vismaz vienu lauku, tad ģenerē AI profilu.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary !px-3 !py-1.5 text-sm"
                  disabled={addModalBusy}
                  onClick={() => {
                    setShowCreatePersonalize(false);
                    setCreateNotes(EMPTY_PARENT_NOTES);
                    setCreateProfileDraft("");
                  }}
                >
                  Paslēpt
                </button>
              </div>

              <ParentNotesFields
                notes={createNotes}
                onChange={setCreateNotes}
                disabled={addModalBusy}
              />

              <button
                type="button"
                className="btn btn-accent w-full"
                disabled={
                  addModalBusy || !parentNotesHaveContent(createNotes)
                }
                onClick={generateCreateDraft}
              >
                {createDraftBusy
                  ? "Ģenerē…"
                  : createProfileDraft
                    ? "Ģenerēt profilu no jauna"
                    : "Izveidot personalizēto profilu"}
              </button>

              {createProfileDraft.trim() ? (
                <div>
                  <label className="text-sm font-medium text-[var(--ink)]">
                    AI profils — pārskati un labo, ja vajag
                  </label>
                  <textarea
                    className="field mt-2 min-h-[140px]"
                    disabled={addModalBusy}
                    value={createProfileDraft}
                    onChange={(e) => setCreateProfileDraft(e.target.value)}
                  />
                </div>
              ) : null}
            </div>
          )}

          <button className="btn btn-primary w-full" disabled={addModalBusy}>
            {loading ? "Pievieno…" : "Pievienot bērnu"}
          </button>
          {createProfileDraft.trim() ? (
            <p className="text-sm text-[var(--ink-soft)]">
              Tiks saglabāts arī apstiprinātais personalizētais profils.
            </p>
          ) : null}
        </form>
      </ParentPanelModal>

      <ParentGateDialog
        open={pendingViewChildId !== null}
        mode="create"
        busy={gateBusy}
        error={gateError}
        onClose={() => {
          if (gateBusy) return;
          setPendingViewChildId(null);
          setGateError(null);
        }}
        onSubmit={createGatePinAndView}
      />
    </main>
  );
}
