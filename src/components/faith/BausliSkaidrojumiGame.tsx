"use client";

import { useState } from "react";
import dataJson from "@/data/faith/bausli-skaidrojumi.json";
import { shuffle } from "@/components/faith/shuffle";

type Item = {
  commandment: string;
  correct: string;
  options: string[];
};

const DATA = dataJson as Item[];

type Phase = "setup" | "game" | "result";

export function BausliSkaidrojumiGame() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [shuffled, setShuffled] = useState<Item[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  function startGame() {
    const next = shuffle(DATA);
    setShuffled(next);
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setAnswered(false);
    setOptions(shuffle(next[0].options));
    setPhase("game");
  }

  function selectOption(opt: string) {
    if (answered) return;
    setSelected(opt);
  }

  function checkAnswer() {
    if (!selected || answered) return;
    const q = shuffled[current];
    const isCorrect = selected === q.correct;
    setAnswered(true);
    if (isCorrect) setScore((s) => s + 1);
  }

  function nextQuestion() {
    const next = current + 1;
    if (next >= shuffled.length) {
      setPhase("result");
      return;
    }
    setCurrent(next);
    setSelected(null);
    setAnswered(false);
    setOptions(shuffle(shuffled[next].options));
  }

  const q = shuffled[current];
  const percent =
    shuffled.length > 0
      ? Math.round((score / shuffled.length) * 100)
      : 0;

  return (
    <div className="flashcards">
      {phase === "setup" ? (
        <>
          <div id="intro">
            <p>
              <strong>Izvēlies pareizo skaidrojumu katram bauslim.</strong>
            </p>
          </div>
          <div id="setup" className="flashcards__card">
            <button
              type="button"
              className="flashcards__btn flashcards__btn--primary"
              onClick={startGame}
            >
              Sākt spēli
            </button>
          </div>
        </>
      ) : null}

      {phase === "game" && q ? (
        <div id="game" className="flashcards__card">
          <div className="flashcards__topbar">
            <span>
              {current + 1} / {shuffled.length}
            </span>
            <span>{percent}%</span>
          </div>

          <div className="flashcards__flashcard">
            <div>{q.commandment}</div>
          </div>

          <div id="options" className="flashcards__options">
            {options.map((opt) => {
              let cls = "flashcards__btn flashcards__btn--option";
              if (!answered && selected === opt) {
                cls += " flashcards__btn--selected";
              }
              if (answered) {
                if (opt === q.correct) cls += " flashcards__btn--correct";
                else if (opt === selected) cls += " flashcards__btn--wrong";
              }
              return (
                <button
                  key={opt}
                  type="button"
                  className={cls}
                  disabled={answered}
                  onClick={() => selectOption(opt)}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {answered ? (
            <div
              className={`flashcards__feedback ${
                selected === q.correct
                  ? "flashcards__feedback--correct"
                  : "flashcards__feedback--wrong"
              }`}
            >
              {selected === q.correct ? "✔ Pareizi!" : "✖ Nepareizi!"}
            </div>
          ) : null}

          <div id="actionRow" className="flashcards__action-row">
            {!answered ? (
              <button
                type="button"
                className="flashcards__btn flashcards__btn--primary"
                disabled={!selected}
                onClick={checkAnswer}
              >
                Pārbaudīt
              </button>
            ) : (
              <button
                type="button"
                className="flashcards__btn flashcards__btn--secondary"
                onClick={nextQuestion}
              >
                Tālāk <span style={{ marginLeft: 6 }}>➜</span>
              </button>
            )}
          </div>
        </div>
      ) : null}

      {phase === "result" ? (
        <div id="result" className="flashcards__card">
          <h2 id="finalScore">
            Rezultāts: {score} / {shuffled.length}
          </h2>
          <button
            type="button"
            className="flashcards__btn flashcards__btn--restart"
            onClick={startGame}
          >
            Spēlēt vēlreiz
          </button>
        </div>
      ) : null}
    </div>
  );
}
