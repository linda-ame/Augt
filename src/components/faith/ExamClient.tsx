"use client";

import { useEffect, useState } from "react";
import eksamensJson from "@/data/faith/eksamens.json";
import dievsJson from "@/data/faith/dievs.json";
import bausliJson from "@/data/faith/bausli.json";
import sakramentiJson from "@/data/faith/sakramenti.json";
import { shuffle } from "@/components/faith/shuffle";

const SAVE_KEY = "augt-exam-resume";

type QaItem = { nr: number; q: string; a: string | string[] };
type ThemeData = {
  sections: {
    groups: { items: QaItem[] }[];
  }[];
};

type ExamItem = {
  id: number;
  q: string;
  answerNrs?: number[];
  extraAnswer?: string;
};

type Question = { q: string; a: string };

type SaveData = {
  questions: Question[];
  currentIndex: number;
  score: number;
};

type Phase = "setup" | "game" | "result";

function formatAnswer(a: string | string[]): string {
  return Array.isArray(a) ? a.join("\n") : a;
}

function collectAnswers(data: ThemeData, map: Record<number, string>) {
  data.sections.forEach((s) =>
    s.groups.forEach((g) =>
      g.items.forEach((i) => {
        map[i.nr] = formatAnswer(i.a);
      }),
    ),
  );
}

function buildAnswer(q: ExamItem, map: Record<number, string>): string {
  const parts: string[] = [];
  if (q.answerNrs && q.answerNrs.length > 0) {
    q.answerNrs.forEach((id) => {
      if (map[id]) parts.push(map[id]);
    });
  }
  if (q.extraAnswer) parts.push(q.extraAnswer);
  return parts.join("\n\n");
}

function loadAllData(): { eksamens: ExamItem[]; answerMap: Record<number, string> } {
  const answerMap: Record<number, string> = {};
  collectAnswers(dievsJson as ThemeData, answerMap);
  collectAnswers(bausliJson as ThemeData, answerMap);
  collectAnswers(sakramentiJson as ThemeData, answerMap);
  return { eksamens: eksamensJson as ExamItem[], answerMap };
}

export function ExamClient() {
  const [ready, setReady] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [phase, setPhase] = useState<Phase>("setup");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [countValue, setCountValue] = useState("10");
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
    setQuestions(data.questions);
    setCurrentIndex(data.currentIndex);
    setScore(data.score);
    setShowAnswerCard(false);
    setPhase("game");
    setShowResume(false);
  }

  function startGame() {
    const { eksamens, answerMap } = loadAllData();
    let selected: ExamItem[];
    if (countValue === "all") {
      selected = shuffle(eksamens);
    } else {
      const count = parseInt(countValue, 10);
      selected = shuffle(eksamens).slice(0, count);
    }

    const mapped = selected.map((q) => ({
      q: q.q,
      a: buildAnswer(q, answerMap),
    }));

    setQuestions(mapped);
    setCurrentIndex(0);
    setScore(0);
    setShowAnswerCard(false);
    setPhase("game");
    saveGame({ questions: mapped, currentIndex: 0, score: 0 });
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
                Šie ir lielie eksāmena jautājumi, kādus priesteris varētu
                uzdot, pārbaudot Tavu gatavību sakramentu saņemšanai.
              </strong>
            </p>
            <p className="flashcards__text">
              Izlasi jautājumu, padomā atbildi un pārbaudi sevi. Pēc tam
              atzīmē, vai zināji.
            </p>
            <p className="flashcards__text">
              Atbildes tiek automātiski ģenerētas no mācību materiāliem.
            </p>
          </div>

          <div id="setup" className="flashcards__card">
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
              Pārbaudīt
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
