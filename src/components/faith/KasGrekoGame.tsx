"use client";

import { useState } from "react";
import dataJson from "@/data/faith/kas-greko.json";
import { shuffle } from "@/components/faith/shuffle";

type Item = {
  id: number;
  question: string;
  commandment: string;
  meaning: string;
  correct: string;
  options: string[];
};

const DATA = dataJson as Item[];

type Phase = "setup" | "game" | "result";

export function KasGrekoGame() {
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
    setAnswered(true);
    if (selected === q.correct) setScore((s) => s + 1);
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
  const isCorrect = selected === q?.correct;

  return (
    <div className="flashcards">
      {phase === "setup" ? (
        <section id="setup" className="flashcards__screen">
          <p className="flashcards__text">
            Izvēlies, kura rīcība grēko pret konkrēto bausli.
          </p>
          <button
            type="button"
            className="flashcards__btn flashcards__btn--primary"
            onClick={startGame}
          >
            Sākt spēli
          </button>
        </section>
      ) : null}

      {phase === "game" && q ? (
        <section id="game" className="flashcards__screen">
          <div className="flashcards__top">
            <div>
              {current + 1} / {shuffled.length}
            </div>
            <div>{percent}%</div>
          </div>

          <h2 className="flashcards__question">{q.question}</h2>

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
                isCorrect
                  ? "flashcards__feedback--correct"
                  : "flashcards__feedback--wrong"
              }`}
            >
              <div
                className={`flashcards__feedback-result ${
                  isCorrect
                    ? "flashcards__feedback-result--correct"
                    : "flashcards__feedback-result--wrong"
                }`}
              >
                {isCorrect ? "✔ Pareizi!" : "✖ Nepareizi!"}
              </div>
              <div className="flashcards__feedback-commandment">
                <strong>{q.id}. bauslis:</strong> {q.commandment}
              </div>
              <div className="flashcards__feedback-meaning">{q.meaning}</div>
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
        </section>
      ) : null}

      {phase === "result" ? (
        <section id="result" className="flashcards__screen">
          <h2 className="flashcards__title">Spēle pabeigta!</h2>
          <p id="finalScore" className="flashcards__result">
            Rezultāts: {score} / {shuffled.length}
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
