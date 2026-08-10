"use client";

import { useEffect, useState } from "react";
import dievsJson from "@/data/faith/dievs.json";
import bausliJson from "@/data/faith/bausli.json";
import sakramentiJson from "@/data/faith/sakramenti.json";
import { shuffle } from "@/components/faith/shuffle";

const SAVE_KEY = "augt-flashcards-resume";

type QaItem = { nr: number; q: string; a: string | string[] };
type ThemeData = {
  sections: {
    groups: { items: QaItem[] }[];
  }[];
};

type Question = { q: string; a: string };

type SaveData = {
  questions: Question[];
  currentIndex: number;
  score: number;
  selectedThemes: string[];
  selectedCount: number;
};

type Phase = "setup" | "game" | "result";

function formatAnswer(a: string | string[]): string {
  return Array.isArray(a) ? a.join("\n") : a;
}

function extractQuestions(data: ThemeData): Question[] {
  const q: Question[] = [];
  data.sections.forEach((s) =>
    s.groups.forEach((g) =>
      g.items.forEach((i) => q.push({ q: i.q, a: formatAnswer(i.a) })),
    ),
  );
  return q;
}

const THEME_DATA: Record<string, ThemeData> = {
  dievs: dievsJson as ThemeData,
  bausli: bausliJson as ThemeData,
  sakramenti: sakramentiJson as ThemeData,
};

export function FlashcardsClient() {
  const [ready, setReady] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [phase, setPhase] = useState<Phase>("setup");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [countValue, setCountValue] = useState("10");
  const [allChecked, setAllChecked] = useState(false);
  const [themeChecks, setThemeChecks] = useState({
    dievs: false,
    bausli: false,
    sakramenti: false,
  });
  const [showAnswerCard, setShowAnswerCard] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) setShowResume(true);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  function saveGame(data: SaveData) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }

  function clearSave() {
    localStorage.removeItem(SAVE_KEY);
  }

  function loadGame() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw) as SaveData;
    setQuestions(data.questions || []);
    setCurrentIndex(data.currentIndex || 0);
    setScore(data.score || 0);
    setSelectedThemes(data.selectedThemes || []);
    setShowAnswerCard(false);
    setPhase("game");
    setShowResume(false);
  }

  function startGame() {
    let themes = Object.entries(themeChecks)
      .filter(([, on]) => on)
      .map(([k]) => k);

    if (allChecked) {
      themes = ["dievs", "bausli", "sakramenti"];
    }

    if (themes.length === 0) {
      alert("Lūdzu izvēlies vismaz vienu tēmu!");
      return;
    }

    let all: Question[] = [];
    for (const t of themes) {
      all.push(...extractQuestions(THEME_DATA[t]));
    }

    let selected: Question[];
    let selectedCount = 10;
    if (countValue === "all") {
      selected = shuffle(all);
    } else {
      selectedCount = parseInt(countValue, 10);
      selected = shuffle(all).slice(0, Math.min(selectedCount, all.length));
    }

    setSelectedThemes(themes);
    setQuestions(selected);
    setCurrentIndex(0);
    setScore(0);
    setShowAnswerCard(false);
    setPhase("game");

    saveGame({
      questions: selected,
      currentIndex: 0,
      score: 0,
      selectedThemes: themes,
      selectedCount,
    });
  }

  function revealAnswer() {
    setShowAnswerCard(true);
  }

  function answer(type: "zinaju" | "dalēji" | "nezinaju") {
    let nextScore = score;
    if (type === "zinaju") nextScore += 1;
    if (type === "dalēji") nextScore += 0.5;

    const nextIndex = currentIndex + 1;
    setScore(nextScore);

    if (nextIndex >= questions.length) {
      clearSave();
      setScore(nextScore);
      setPhase("result");
      return;
    }

    setCurrentIndex(nextIndex);
    setShowAnswerCard(false);
    saveGame({
      questions,
      currentIndex: nextIndex,
      score: nextScore,
      selectedThemes,
      selectedCount:
        countValue === "all" ? questions.length : parseInt(countValue, 10),
    });
  }

  function restartSame() {
    const reshuffled = shuffle(questions);
    setQuestions(reshuffled);
    setCurrentIndex(0);
    setScore(0);
    setShowAnswerCard(false);
    setPhase("game");
    saveGame({
      questions: reshuffled,
      currentIndex: 0,
      score: 0,
      selectedThemes,
      selectedCount: reshuffled.length,
    });
  }

  function goHome() {
    clearSave();
    setPhase("setup");
    setShowAnswerCard(false);
  }

  if (!ready) {
    return <p className="text-[var(--ink-soft)]">Ielādē…</p>;
  }

  const progressPercent =
    questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;
  const q = questions[currentIndex];

  return (
    <div className="flashcards">
      {showResume ? (
        <div className="save-modal-overlay">
          <div className="save-modal">
            <h2>Turpināt testu?</h2>
            <p>Atrasts nepabeigts tests.</p>
            <div className="save-modal-buttons">
              <button type="button" id="continueGameBtn" onClick={loadGame}>
                Turpināt
              </button>
              <button
                type="button"
                id="newGameBtn"
                onClick={() => {
                  clearSave();
                  setShowResume(false);
                }}
              >
                Jauna spēle
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {phase === "setup" ? (
        <>
          <div id="intro">
            <p>
              <strong>
                Izlasi jautājumu, padomā atbildi (nekas nav jāraksta) un
                pārbaudi sevi. Pēc tam atzīmē, vai zināji.
              </strong>
            </p>
            <p className="flashcards__text">
              Lai spēlētu, izvēlies tēmas un jautājumu skaitu.
            </p>
          </div>

          <div id="setup" className="flashcards__card">
            <h3>Tēmas</h3>
            <div className="flashcards__checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={themeChecks.dievs}
                  onChange={(e) =>
                    setThemeChecks((t) => ({ ...t, dievs: e.target.checked }))
                  }
                />{" "}
                Dievs un ticība
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={themeChecks.bausli}
                  onChange={(e) =>
                    setThemeChecks((t) => ({ ...t, bausli: e.target.checked }))
                  }
                />{" "}
                Baušļi
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={themeChecks.sakramenti}
                  onChange={(e) =>
                    setThemeChecks((t) => ({
                      ...t,
                      sakramenti: e.target.checked,
                    }))
                  }
                />{" "}
                Sakramenti
              </label>
              <label>
                <input
                  type="checkbox"
                  id="all"
                  checked={allChecked}
                  onChange={(e) => setAllChecked(e.target.checked)}
                />{" "}
                Visas
              </label>
            </div>

            <h3>Jautājumu skaits</h3>
            <select
              id="count"
              className="flashcards__select"
              value={countValue}
              onChange={(e) => setCountValue(e.target.value)}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="40">40</option>
              <option value="50">50</option>
              <option value="all">Visi</option>
            </select>

            <button
              type="button"
              className="flashcards__btn flashcards__btn--primary"
              onClick={startGame}
            >
              Sākt
            </button>
          </div>
        </>
      ) : null}

      {phase === "game" && q ? (
        <div id="game" className="flashcards__card">
          <div className="flashcards__topbar">
            <span>
              Jautājums {currentIndex + 1}/{questions.length}
            </span>
            <span>{Math.round(progressPercent)}%</span>
          </div>

          <div id="questionCard" className="flashcards__flashcard">
            <div id="question">{q.q}</div>
          </div>

          {showAnswerCard ? (
            <div id="answerCard" className="flashcards__flashcard">
              <div id="answer">{q.a}</div>
            </div>
          ) : null}

          {!showAnswerCard ? (
            <button
              type="button"
              id="showBtn"
              className="flashcards__btn flashcards__btn--secondary"
              onClick={revealAnswer}
            >
              Parādīt atbildi
            </button>
          ) : (
            <div id="answerButtons" className="flashcards__answers">
              <button
                type="button"
                className="flashcards__btn flashcards__btn--green"
                onClick={() => answer("zinaju")}
              >
                Zināju
              </button>
              <button
                type="button"
                className="flashcards__btn flashcards__btn--yellow"
                onClick={() => answer("dalēji")}
              >
                Daļēji
              </button>
              <button
                type="button"
                className="flashcards__btn flashcards__btn--red"
                onClick={() => answer("nezinaju")}
              >
                Nezināju
              </button>
            </div>
          )}

          <div className="flashcards__progress">
            <div
              id="progressBar"
              className="flashcards__progress-bar"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      ) : null}

      {phase === "result" ? (
        <div id="result" className="flashcards__card">
          <h2 id="finalScore">
            Rezultāts: {score}/{questions.length} (
            {Math.round((score / questions.length) * 100)}%)
          </h2>
          <button
            type="button"
            className="flashcards__btn flashcards__btn--restart"
            onClick={restartSame}
          >
            Spēlēt vēlreiz
          </button>
          <button
            type="button"
            className="flashcards__btn flashcards__btn--new"
            onClick={goHome}
          >
            Mainīt iestatījumus
          </button>
        </div>
      ) : null}
    </div>
  );
}
