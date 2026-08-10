"use client";

import { useEffect, useState } from "react";
import appDataJson from "@/data/confession/sirdsapzinas-izmeklesana.json";
import pdfDataJson from "@/data/confession/greksudze.json";
import {
  createEmptyConfessionState,
  STORAGE_KEY,
  type ConfessionAppData,
  type ConfessionPdfData,
  type ConfessionState,
  type ConfessionStep,
  type CustomSin,
} from "@/lib/confession-types";
import { generateConfessionPdf } from "@/lib/confession-pdf";
import "./confession.css";

const appData = appDataJson as ConfessionAppData;
const pdfData = pdfDataJson as ConfessionPdfData;

function loadSavedState(): ConfessionState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state: ConfessionState };
    const hours = Number(parsed.state.saveDuration || 0);
    if (!hours) return null;
    const diff = Date.now() - parsed.state.updatedAt;
    if (diff > hours * 60 * 60 * 1000) return null;
    return parsed.state;
  } catch {
    return null;
  }
}

function persist(state: ConfessionState) {
  if (!state.saveDuration) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ state: { ...state, updatedAt: Date.now() } }),
  );
}

export function ConfessionClient({
  ageLabel,
  canChangeAge = false,
}: {
  ageLabel: string;
  canChangeAge?: boolean;
}) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<ConfessionState>(createEmptyConfessionState);
  const [step, setStep] = useState<ConfessionStep>("intro");
  const [showResume, setShowResume] = useState(false);
  const [showClear, setShowClear] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadSavedState();
    if (saved) {
      setState(saved);
      setShowResume(true);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || showResume) return;
    persist({ ...state, step });
  }, [state, step, ready, showResume]);

  function updateState(patch: Partial<ConfessionState>) {
    setState((prev) => ({ ...prev, ...patch, updatedAt: Date.now() }));
  }

  function go(next: ConfessionStep) {
    setStep(next);
    updateState({ step: next });
    window.scrollTo(0, 0);
  }

  function resumeContinue() {
    setShowResume(false);
    setStep(state.step || "intro");
  }

  function resumeRestart() {
    localStorage.removeItem(STORAGE_KEY);
    const empty = createEmptyConfessionState();
    setState(empty);
    setStep("intro");
    setShowResume(false);
  }

  function resetOnlyContent() {
    updateState({ answers: {}, notes: {}, customSins: [] });
    setShowClear(false);
  }

  function resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    setState(createEmptyConfessionState());
    setStep("intro");
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
    setPdfBusy(true);
    setPdfError(null);
    try {
      await generateConfessionPdf({
        appData,
        pdfData,
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
      <main className="confession-app mx-auto max-w-2xl px-6 pb-8 pt-2">
        <p className="text-[var(--ink-soft)]">Ielādē…</p>
      </main>
    );
  }

  const intro = appData.content.intro;
  const prayer = appData.content.preparation_prayer;
  const closing = appData.content.after_examination_prayer;

  return (
    <main className="confession-app mx-auto max-w-2xl px-6 pb-8 pt-2">
      <header className="confession-header flex items-center justify-between gap-3">
        <p className="text-sm leading-none text-[var(--ink-soft)]">{ageLabel}</p>
        {canChangeAge ? (
          <a
            href="/?changeAge=1"
            className="btn btn-secondary shrink-0 !px-3 !py-1.5 text-sm"
          >
            Mainīt vecumu
          </a>
        ) : null}
      </header>

      {step === "intro" && (
        <section className="confession-screen mt-6">
          <h2 className="confession-kicker">SIRDSAPZIŅAS IZMEKLĒŠANA</h2>
          <h2 className="confession-title">{intro.title}</h2>
          <div className="confession-prose">
            {intro.text.map((t) => (
              <p key={t.slice(0, 40)}>{t}</p>
            ))}
          </div>

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
          <h2 className="confession-kicker">SIRDSAPZIŅAS IZMEKLĒŠANA</h2>
          <h2 className="confession-title mt-4">{prayer.title}</h2>
          <div className="confession-prose prayer-text">
            {prayer.text.map((t) => (
              <p key={t.slice(0, 40)}>{t}</p>
            ))}
            <hr />
            <h3>{prayer.prayer.title}</h3>
            {prayer.prayer.text.map((t) => (
              <p key={t}>{t}</p>
            ))}
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
          <h2 className="confession-title mb-3">Vai tas attiecas uz mani?</h2>

          <div className="questions-container">
            {appData.content.commandments.map((cmd) => (
              <div key={cmd.id} className="commandment">
                <h3>{cmd.title}</h3>
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
            <button type="button" className="modal-cancel" onClick={() => setShowClear(false)}>
              Atcelt
            </button>
            <button type="button" className="modal-content" onClick={resetOnlyContent}>
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
            <button type="button" className="modal-cancel" onClick={resumeContinue}>
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
