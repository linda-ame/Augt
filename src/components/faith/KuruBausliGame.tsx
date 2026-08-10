"use client";

import { useState } from "react";
import dataJson from "@/data/faith/kuru-bausli-parkapj.json";
import { shuffle } from "@/components/faith/shuffle";

type Item = {
  id: string;
  text: string;
  answer: number;
  options: number[];
};

const DATA = dataJson as Item[];
const QUESTIONS_PER_GAME = 20;

const COMMANDMENTS = [
  "Tev nebūs citus dievus turēt līdzās manim.",
  "Tev nebūs Kunga, sava Dieva, vārdu nelietīgi valkāt.",
  "Tev būs svēto dienu svētīt.",
  "Tev būs godāt savu tēvu un māti.",
  "Tev nebūs nokaut.",
  "Tev nebūs laulību pārkāpt.",
  "Tev nebūs zagt.",
  "Tev nebūs nepatiesu liecību dot pret savu tuvāko.",
  "Tev nebūs iekārot sava tuvākā laulāto.",
  "Tev nebūs iekārot neko, kas pieder tavam tuvākam.",
];

type Phase = "setup" | "game" | "result";

export function KuruBausliGame() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [shuffled, setShuffled] = useState<Item[]>([]);
  const [options, setOptions] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  function startGame() {
    const next = shuffle(DATA).slice(0, QUESTIONS_PER_GAME);
    setShuffled(next);
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setAnswered(false);
    setOptions(shuffle(next[0].options));
    setPhase("game");
  }

  function selectOption(opt: number) {
    if (answered) return;
    setSelected(opt);
  }

  function checkAnswer() {
    if (selected === null || answered) return;
    const q = shuffled[current];
    const correct = Number(q.answer);
    setAnswered(true);
    if (selected === correct) setScore((s) => s + 1);
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
  const correct = q ? Number(q.answer) : 0;
  const percent =
    shuffled.length > 0
      ? Math.round((score / shuffled.length) * 100)
      : 0;
  const isCorrect = selected === correct;

  return (
    <div className="flashcards">
      {phase === "setup" ? (
        <section id="setup" className="flashcards__screen">
          <p className="flashcards__text">
            Izlasi un izdomā, kuru bausli bērni pārkāpj ar savu rīcību.
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

          <h2 className="flashcards__question">{q.text}</h2>

          <div id="options" className="flashcards__options">
            {options.map((opt) => {
              let cls = "flashcards__btn flashcards__btn--option";
              if (!answered && selected === opt) {
                cls += " flashcards__btn--selected";
              }
              if (answered) {
                if (opt === correct) cls += " flashcards__btn--correct";
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
                  {opt}. bauslis
                </button>
              );
            })}
          </div>

          {answered ? (
            <div className="flashcards__feedback">
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
                <strong>{correct}. bauslis:</strong>
                <br />
                {COMMANDMENTS[correct - 1]}
              </div>
            </div>
          ) : null}

          <div id="actionRow" className="flashcards__action-row">
            {!answered ? (
              <button
                type="button"
                className="flashcards__btn flashcards__btn--primary"
                disabled={selected === null}
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
                Tālāk ➜
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
