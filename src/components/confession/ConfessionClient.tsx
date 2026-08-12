"use client";

import { useEffect, useState } from "react";
import childrenIntro from "@/data/confession/children/sirdsapzinas-izmeklesana.json";
import {
  createEmptyConfessionState,
  loadHideWelcomePreference,
  saveHideWelcomePreference,
  type ConfessionState,
  type ConfessionStep,
  type CustomSin,
} from "@/lib/confession-types";
import { generateConfessionPdf } from "@/lib/confession-pdf";
import {
  CONFESSION_VERSIONS,
  getConfessionVersion,
  type ConfessionVersion,
  type ConfessionVersionId,
} from "@/lib/confession-versions";
import {
  confessionToneClass,
  visualToneFromConfessionVersion,
} from "@/lib/visual-tone";
import "./confession.css";

const WELCOME_INTRO = childrenIntro.content.intro;

function loadSavedState(storageKey: string): ConfessionState | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state: ConfessionState };
    const hours = Number(parsed.state.saveDuration || 0);
    if (!hours) return null;
    const diff = Date.now() - parsed.state.updatedAt;
    if (diff > hours * 60 * 60 * 1000) return null;
    // Migrate old step name from earlier Augt builds.
    const rawStep = parsed.state.step as string;
    const step: ConfessionStep =
      rawStep === "intro" ? "setup" : (parsed.state.step as ConfessionStep);
    return { ...parsed.state, step };
  } catch {
    return null;
  }
}

function persist(storageKey: string, state: ConfessionState) {
  if (!state.saveDuration) {
    localStorage.removeItem(storageKey);
    return;
  }
  localStorage.setItem(
    storageKey,
    JSON.stringify({ state: { ...state, updatedAt: Date.now() } }),
  );
}

function migrateLegacyIfNeeded(version: ConfessionVersion) {
  if (!version.legacyStorageKey) return;
  if (localStorage.getItem(version.storageKey)) return;
  const legacy = localStorage.getItem(version.legacyStorageKey);
  if (!legacy) return;
  localStorage.setItem(version.storageKey, legacy);
  localStorage.removeItem(version.legacyStorageKey);
}

function normalizeResumeStep(step: ConfessionStep | undefined): ConfessionStep {
  if (!step || step === "welcome" || step === "pick") return "setup";
  if ((step as string) === "intro") return "setup";
  return step;
}

export function ConfessionClient() {
  const [ready, setReady] = useState(false);
  const [versionId, setVersionId] = useState<ConfessionVersionId | null>(null);
  const [state, setState] = useState<ConfessionState>(createEmptyConfessionState);
  const [step, setStep] = useState<ConfessionStep>("welcome");
  const [hideWelcomeChecked, setHideWelcomeChecked] = useState(false);
  const [welcomeHidden, setWelcomeHidden] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [showClear, setShowClear] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const version = versionId ? getConfessionVersion(versionId) : null;
  const storageKey = version?.storageKey ?? null;
  const toneClass = versionId
    ? confessionToneClass(visualToneFromConfessionVersion(versionId))
    : "";

  useEffect(() => {
    const hide = loadHideWelcomePreference();
    setHideWelcomeChecked(hide);
    setWelcomeHidden(hide);
    setStep(hide ? "pick" : "welcome");
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !version || !storageKey) return;
    migrateLegacyIfNeeded(version);
    const saved = loadSavedState(storageKey);
    if (saved) {
      setState(saved);
      setShowResume(true);
    } else {
      setState(createEmptyConfessionState());
      setShowResume(false);
    }
  }, [ready, versionId, storageKey, version]);

  useEffect(() => {
    if (!ready || !storageKey || showResume) return;
    if (step === "welcome" || step === "pick") return;
    persist(storageKey, { ...state, step });
  }, [state, step, ready, showResume, storageKey]);

  function updateState(patch: Partial<ConfessionState>) {
    setState((prev) => ({ ...prev, ...patch, updatedAt: Date.now() }));
  }

  function go(next: ConfessionStep) {
    setStep(next);
    updateState({ step: next });
    window.scrollTo(0, 0);
  }

  function continueFromWelcome() {
    saveHideWelcomePreference(hideWelcomeChecked);
    setWelcomeHidden(hideWelcomeChecked);
    setStep("pick");
    window.scrollTo(0, 0);
  }

  function selectVersion(id: ConfessionVersionId) {
    setVersionId(id);
    setState(createEmptyConfessionState());
    setStep("setup");
    setShowResume(false);
    setPdfError(null);
    window.scrollTo(0, 0);
  }

  function changeVersion() {
    setVersionId(null);
    setState(createEmptyConfessionState());
    setStep("pick");
    setShowResume(false);
    setShowClear(false);
    setPdfError(null);
    window.scrollTo(0, 0);
  }

  function resumeContinue() {
    setShowResume(false);
    setStep(normalizeResumeStep(state.step));
  }

  function resumeRestart() {
    if (storageKey) localStorage.removeItem(storageKey);
    const empty = createEmptyConfessionState();
    setState(empty);
    setStep("setup");
    setShowResume(false);
  }

  function resetOnlyContent() {
    updateState({ answers: {}, notes: {}, customSins: [] });
    setShowClear(false);
  }

  function resetAll() {
    if (storageKey) localStorage.removeItem(storageKey);
    setState(createEmptyConfessionState());
    setStep("setup");
    setShowClear(false);
  }

  function toggleAnswer(id: string, checked: boolean) {
    setState((prev) => {
      const answers = { ...prev.answers, [id]: checked };
      const notes = { ...prev.notes };
      if (!checked) delete notes[id];
      return { ...prev, answers, notes, updatedAt: Date.now() };
    });
  }

  function setNote(id: string, value: string) {
    setState((prev) => ({
      ...prev,
      notes: { ...prev.notes, [id]: value },
      updatedAt: Date.now(),
    }));
  }

  function clearNote(id: string) {
    setState((prev) => {
      const notes = { ...prev.notes };
      delete notes[id];
      return { ...prev, notes, updatedAt: Date.now() };
    });
  }

  function addCustomSin() {
    const sin: CustomSin = { id: `custom_${Date.now()}`, text: "" };
    setState((prev) => ({
      ...prev,
      customSins: [...prev.customSins, sin],
      updatedAt: Date.now(),
    }));
  }

  function updateCustomSin(id: string, text: string) {
    setState((prev) => ({
      ...prev,
      customSins: prev.customSins.map((s) =>
        s.id === id ? { ...s, text } : s,
      ),
      updatedAt: Date.now(),
    }));
  }

  function removeCustomSin(id: string) {
    setState((prev) => ({
      ...prev,
      customSins: prev.customSins.filter((s) => s.id !== id),
      updatedAt: Date.now(),
    }));
  }

  async function onGeneratePdf() {
    if (!version) return;
    setPdfBusy(true);
    setPdfError(null);
    try {
      await generateConfessionPdf({
        appData: version.appData,
        pdfData: version.pdfData,
        state: { ...state, step },
      });
    } catch (err) {
      console.error(err);
      setPdfError("Neizdevās sagatavot PDF. Mēģini vēlreiz.");
    } finally {
      setPdfBusy(false);
    }
  }

  if (!ready) {
    return (
      <main className={`confession-app ${toneClass} mx-auto max-w-2xl px-6 pb-8 pt-2`}>
        <p className="text-[var(--ink-soft)]">Ielādē…</p>
      </main>
    );
  }

  if (step === "welcome") {
    return (
      <main className={`confession-app ${toneClass} mx-auto max-w-2xl px-6 pb-8 pt-2`}>
        <section className="confession-screen mt-2">
          <h2 className="confession-kicker">GRĒKSŪDZE</h2>
          <h2 className="confession-title">{WELCOME_INTRO.title}</h2>
          <div className="confession-prose mt-3">
            {WELCOME_INTRO.text.map((t) => (
              <p key={t.slice(0, 40)}>{t}</p>
            ))}
          </div>

          <label className="confession-check mt-5">
            <input
              type="checkbox"
              checked={hideWelcomeChecked}
              onChange={(e) => setHideWelcomeChecked(e.target.checked)}
            />
            <span>Nerādīt vairs šo ievadu</span>
          </label>

          <button
            type="button"
            className="confession-btn confession-btn-primary"
            onClick={continueFromWelcome}
          >
            Turpināt
          </button>
        </section>
      </main>
    );
  }

  if (step === "pick" || !version) {
    return (
      <main className={`confession-app ${toneClass} mx-auto max-w-2xl px-6 pb-8 pt-2`}>
        <section className="confession-screen mt-2">
          <h2 className="confession-kicker">GRĒKSŪDZE</h2>
          <h2 className="confession-title">Izvēlies versiju</h2>
          <p className="mt-3 text-[var(--ink-soft)] leading-relaxed">
            Sirdsapziņas izmeklēšana ir pielāgota vecumam. Izvēle šeit nav saistīta
            ar dienas nodarbības vecuma grupu.
          </p>
          <div className="version-list mt-6">
            {CONFESSION_VERSIONS.map((v) => (
              <button
                key={v.id}
                type="button"
                className="version-card"
                onClick={() => selectVersion(v.id)}
              >
                <span className="version-card-title">{v.title}</span>
                <span className="version-card-sub">{v.subtitle}</span>
              </button>
            ))}
          </div>
          {welcomeHidden ? (
            <label className="confession-check confession-check-quiet">
              <input
                type="checkbox"
                checked={false}
                onChange={(e) => {
                  if (!e.target.checked) return;
                  saveHideWelcomePreference(false);
                  setWelcomeHidden(false);
                  setHideWelcomeChecked(false);
                  setStep("welcome");
                  window.scrollTo(0, 0);
                }}
              />
              <span>Rādīt ievadu</span>
            </label>
          ) : null}
        </section>
      </main>
    );
  }

  const appData = version.appData;
  const prayer = appData.content.preparation_prayer;
  const closing = appData.content.after_examination_prayer;

  return (
    <main
      className={`confession-app ${toneClass} mx-auto max-w-2xl px-6 pb-8 pt-2`}
    >
      <header className="confession-header flex items-center justify-between gap-3">
        <p className="text-sm leading-none text-[var(--ink-soft)]">
          {version.title}
        </p>
        <button
          type="button"
          className="btn btn-secondary shrink-0 !px-3 !py-1.5 text-sm"
          onClick={changeVersion}
        >
          Mainīt versiju
        </button>
      </header>

      {step === "setup" && (
        <section className="confession-screen mt-6">
          <h2 className="confession-kicker">SIRDSAPZIŅAS IZMEKLĒŠANA</h2>
          <h2 className="confession-title">Pirms sākuma</h2>
          <p className="mt-3 text-[var(--ink-soft)] leading-relaxed">
            Atzīmē, vai šī ir Tava pirmā grēksūdze, un izvēlies, vai īslaicīgi
            saglabāt pierakstus ierīcē.
          </p>

          <label className="confession-check mt-5">
            <input
              type="checkbox"
              checked={state.firstConfession}
              onChange={(e) =>
                updateState({ firstConfession: e.target.checked })
              }
            />
            <span>Šī ir mana pirmā grēksūdze</span>
          </label>

          <div className="save-row">
            <label htmlFor="saveDuration">Saglabāt ierīcē:</label>
            <select
              id="saveDuration"
              value={String(state.saveDuration)}
              onChange={(e) =>
                updateState({ saveDuration: Number(e.target.value) })
              }
            >
              <option value="0">Nesaglabāt</option>
              <option value="1">1 stunda</option>
              <option value="2">2 stundas</option>
              <option value="3">3 stundas</option>
              <option value="6">6 stundas</option>
              <option value="12">12 stundas</option>
              <option value="24">24 stundas</option>
            </select>
          </div>

          <button
            type="button"
            className="confession-btn confession-btn-primary"
            onClick={() => go("prayer")}
          >
            Turpināt
          </button>
        </section>
      )}

      {step === "prayer" && (
        <section className="confession-screen mt-6">
          <p className="confession-kicker">SIRDSAPZIŅAS IZMEKLĒŠANA</p>
          <h2 className="confession-title mt-3">{prayer.title}</h2>
          {prayer.attribution ? (
            <p className="prep-attribution">{prayer.attribution}</p>
          ) : null}

          <div className="prep-advice">
            {prayer.text.map((t) => (
              <p key={t.slice(0, 40)}>{t}</p>
            ))}
          </div>

          <div className="prep-prayer">
            <h3 className="prep-prayer-title">{prayer.prayer.title}</h3>
            <div className="prep-prayer-body">
              {prayer.prayer.text.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="confession-btn confession-btn-primary"
            onClick={() => go("questions")}
          >
            Sākt sirdsapziņas izmeklēšanu
          </button>
        </section>
      )}

      {step === "questions" && (
        <section className="confession-screen mt-6">
          <h2 className="confession-kicker">SIRDSAPZIŅAS IZMEKLĒŠANA</h2>
          <h2 className="confession-title mb-3">{version.questionsHeading}</h2>

          <div className="questions-container">
            {appData.content.commandments.map((cmd) => (
              <div key={cmd.id} className="commandment">
                <h3>{cmd.title}</h3>
                {cmd.note ? <p className="commandment-note">{cmd.note}</p> : null}
                {cmd.questions.map((q) => {
                  const checked = !!state.answers[q.id];
                  const note = state.notes[q.id] || "";
                  return (
                    <div key={q.id} className="question-row">
                      <div className="question-top">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            toggleAnswer(q.id, e.target.checked)
                          }
                        />
                        <span>{q.text}</span>
                      </div>
                      {checked && (
                        <div className="comment-wrap">
                          <textarea
                            placeholder="Komentārs..."
                            value={note}
                            onChange={(e) => setNote(q.id, e.target.value)}
                          />
                          <button
                            type="button"
                            aria-label="Notīrīt komentāru"
                            onClick={() => clearNote(q.id)}
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {state.customSins.map((sin) => (
              <div key={sin.id} className="question-row custom-sin">
                <div className="question-top">
                  <div className="custom-sin-label">Cits grēks:</div>
                  <button
                    type="button"
                    aria-label="Dzēst"
                    onClick={() => removeCustomSin(sin.id)}
                  >
                    ✕
                  </button>
                </div>
                <textarea
                  placeholder="Apraksti grēku..."
                  value={sin.text}
                  onChange={(e) => updateCustomSin(sin.id, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="mt-4">
            <button
              type="button"
              className="confession-btn confession-btn-primary"
              onClick={addCustomSin}
            >
              + Pievienot citu grēku
            </button>
          </div>

          <div className="closing-prayer">
            <h2>{closing.title}</h2>
            <div className="confession-prose">
              {closing.text.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </div>
          </div>

          <div className="actions">
            <button
              type="button"
              className="confession-btn confession-btn-pdf"
              disabled={pdfBusy}
              onClick={onGeneratePdf}
            >
              {pdfBusy ? "Sagatavo PDF…" : "Sagatavot PDF"}
            </button>
            <button
              type="button"
              className="confession-btn confession-btn-clear"
              onClick={() => setShowClear(true)}
            >
              Dzēst
            </button>
          </div>
          {pdfError && <p className="confession-error">{pdfError}</p>}
        </section>
      )}

      {showClear && (
        <div className="confession-modal" role="dialog" aria-modal="true">
          <div className="confession-modal-box">
            <p>Ko tu vēlies darīt?</p>
            <button
              type="button"
              className="modal-cancel"
              onClick={() => setShowClear(false)}
            >
              Atcelt
            </button>
            <button
              type="button"
              className="modal-content"
              onClick={resetOnlyContent}
            >
              Dzēst tikai saturu
            </button>
            <button type="button" className="modal-all" onClick={resetAll}>
              Dzēst visu un atgriezties sākumā
            </button>
          </div>
        </div>
      )}

      {showResume && (
        <div className="confession-modal" role="dialog" aria-modal="true">
          <div className="confession-modal-box">
            <p>Vai turpināt iepriekšējo sagatavošanos?</p>
            <button
              type="button"
              className="modal-cancel"
              onClick={resumeContinue}
            >
              Turpināt
            </button>
            <button type="button" className="modal-all" onClick={resumeRestart}>
              Sākt no jauna
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
