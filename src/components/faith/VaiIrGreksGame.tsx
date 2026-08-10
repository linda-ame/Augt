"use client";

import { useState } from "react";
import dataJson from "@/data/faith/vai-ir-greks.json";
import { shuffle } from "@/components/faith/shuffle";

type Action = { text: string; correct: boolean };

type Question = {
  id: number;
  situation: string;
  correctSin: string;
  sinExplanation: string;
  actionExplanation: string;
  actions: Action[];
};

type DataFile = {
  gameTitle?: string;
  sinOptions?: string[];
  questions: Question[];
};

const RAW = dataJson as Question[] | DataFile;
const ALL_QUESTIONS: Question[] = Array.isArray(RAW)
  ? RAW
  : RAW.questions;

type Phase = "setup" | "game" | "result";

export function VaiIrGreksGame() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [shuffled, setShuffled] = useState<Question[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedA, setSelectedA] = useState<string | null>(null);
  const [selectedB, setSelectedB] = useState<Set<string>>(new Set());
  const [answered, setAnswered] = useState(false);

  function startGame() {
    const next = shuffle(ALL_QUESTIONS).slice(0, 15);
    setShuffled(next);
    setCurrent(0);
    setScore(0);
    setSelectedA(null);
    setSelectedB(new Set());
    setAnswered(false);
    setActions(shuffle(next[0].actions));
    setPhase("game");
  }

  function toggleB(text: string) {
    if (answered) return;
    setSelectedB((prev) => {
      const next = new Set(prev);
      if (next.has(text)) next.delete(text);
      else next.add(text);
      return next;
    });
  }

  function check() {
    const q = shuffled[current];
    const isSin = q.correctSin === "grēks";
    const userA = selectedA === "Jā";

    let nextScore = score;
    if (userA === isSin) nextScore += 1;

    const correctTexts = q.actions.filter((a) => a.correct).map((a) => a.text);
    for (const text of correctTexts) {
      if (selectedB.has(text)) nextScore += 1;
    }

    setScore(nextScore);
    setAnswered(true);
  }

  function next() {
    const idx = current + 1;
    if (idx >= shuffled.length) {
      setPhase("result");
      return;
    }
    setCurrent(idx);
    setSelectedA(null);
    setSelectedB(new Set());
    setAnswered(false);
    setActions(shuffle(shuffled[idx].actions));
  }

  const q = shuffled[current];
  const percent =
    shuffled.length > 0
      ? Math.round((score / (shuffled.length * 2)) * 100)
      : 0;
  const canCheck = Boolean(selectedA && selectedB.size > 0);

  return (
    <div className="flashcards" id="greks-game">
      {phase === "setup" ? (
        <section id="setup" className="flashcards__screen">
          <p className="flashcards__text">
            Spēlē tu redzēsi dažādas situācijas.
            <br />
            <br />
            A daļā izvēlies, vai tas ir grēks (Jā/Nē).
            <br />
            B daļā vari izvēlēties vairākas pareizas rīcības.
            <br />
            <br />
            👉 B daļā var būt vairāk nekā viena pareiza atbilde!
          </p>
          <button
            type="button"
            id="startBtn"
            className="flashcards__btn flashcards__btn--primary"
            onClick={startGame}
          >
            Sākt spēli
          </button>
        </section>
      ) : null}

      {phase === "game" && q ? (
        <section id="game" className="flashcards__screen">
          <div className="flashcards__card" style={{ margin: 0, padding: 0, border: "none", boxShadow: "none", background: "transparent" }}>
            <div className="flashcards__topbar">
              <span>
                {current + 1} / {shuffled.length}
              </span>
              <span>{percent}%</span>
            </div>

            <div className="flashcards__question">{q.situation}</div>

            <div className="flashcards__section">
              <div className="flashcards__section-title">
                A. Vai tas ir grēks?
              </div>
              <div id="aOptions" className="flashcards__yesno">
                {(["Jā", "Nē"] as const).map((val) => {
                  const isSin = q.correctSin === "grēks";
                  const correct =
                    (val === "Jā" && isSin) || (val === "Nē" && !isSin);
                  let cls = "flashcards__btn flashcards__yesno-btn";
                  if (!answered && selectedA === val) {
                    cls += " flashcards__btn--selected";
                  }
                  if (answered) {
                    if (correct) cls += " flashcards__btn--correct";
                    else if (val === selectedA) cls += " flashcards__btn--wrong";
                  }
                  return (
                    <button
                      key={val}
                      type="button"
                      className={cls}
                      disabled={answered}
                      onClick={() => {
                        if (answered) return;
                        setSelectedA(val);
                      }}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flashcards__section">
              <div className="flashcards__section-title">
                B. Kāda ir pareizā rīcība?
              </div>
              <div id="bOptions" className="flashcards__answers">
                {actions.map((opt) => {
                  const correctTexts = q.actions
                    .filter((a) => a.correct)
                    .map((a) => a.text);
                  let cls = "flashcards__btn flashcards__btn--option";
                  if (!answered && selectedB.has(opt.text)) {
                    cls += " flashcards__btn--selected";
                  }
                  if (answered) {
                    if (correctTexts.includes(opt.text)) {
                      cls += " flashcards__btn--correct";
                    } else if (selectedB.has(opt.text)) {
                      cls += " flashcards__btn--wrong";
                    }
                  }
                  return (
                    <button
                      key={opt.text}
                      type="button"
                      className={cls}
                      disabled={answered}
                      onClick={() => toggleB(opt.text)}
                    >
                      {opt.text}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {answered ? (
            <div id="feedbackArea">
              <div className="flashcards__feedback">
                <div className="flashcards__feedback-commandment">
                  <strong>Grēka skaidrojums:</strong>
                  <br />
                  {q.sinExplanation}
                </div>
                <div className="flashcards__feedback-commandment">
                  <strong>Rīcības skaidrojums:</strong>
                  <br />
                  {q.actionExplanation}
                </div>
              </div>
            </div>
          ) : (
            <div id="feedbackArea" />
          )}

          <div id="actionRow" className="flashcards__action-row">
            <button
              type="button"
              className="flashcards__btn flashcards__btn--primary"
              disabled={!answered && !canCheck}
              onClick={answered ? next : check}
            >
              {answered ? "Tālāk" : "Pārbaudīt"}
            </button>
          </div>
        </section>
      ) : null}

      {phase === "result" ? (
        <section id="result" className="flashcards__screen">
          <h2 className="flashcards__title">Spēle pabeigta!</h2>
          <p id="finalScore" className="flashcards__result">
            Tavi punkti: {score} no {shuffled.length * 2}
          </p>
          <button
            type="button"
            className="flashcards__btn flashcards__btn--primary"
            onClick={startGame}
          >
            Spēlēt vēlreiz
          </button>
        </section>
      ) : null}
    </div>
  );
}
