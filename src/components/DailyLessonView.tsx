"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  formatLatvianDate,
  formatLatvianDateShort,
  todayInRiga,
} from "@/lib/dates";
import { DayHeroArt } from "@/components/DayHeroArt";
import { SectionHeading } from "@/components/SectionHeading";
import { keepParentheticalsTogether } from "@/lib/citation";
import {
  parseAlleluiaDisplay,
  parsePsalmDisplay,
} from "@/lib/liturgical-format";
import {
  normalizeGospelContent,
  CLASSIC_PRAYER_LINES,
  LESSON_TAB_LABELS,
  READING_TAB_LABELS,
  type ActivityContent,
  type DailyLessonContent,
  type EveningPrayer,
  type LessonTabId,
  type MorningPrayer,
  type PartInsight,
  type ReadingRole,
  type ScriptureReading,
} from "@/lib/types";
import {
  loadDayProgress,
  markMorningDone,
  markTabVisited,
  type DayProgress,
} from "@/lib/day-progress";
import { NotificationSoftPrompt } from "@/components/NotificationSoftPrompt";
import { GospelListenButton } from "@/components/GospelListenButton";

function DateSwitcher({
  date,
  dates,
}: {
  date: string;
  dates: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function goTo(d: string) {
    setOpen(false);
    if (d === date) return;
    startTransition(() => {
      router.push(`/kid?date=${d}`);
    });
  }

  return (
    <div ref={rootRef} className="relative inline-block max-w-full">
      <button
        type="button"
        className={`inline-flex max-w-full items-center gap-2 text-left ${
          pending ? "opacity-60" : ""
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-busy={pending}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="brand-mark text-[1.35rem] leading-snug text-[var(--bg-deep)] sm:text-2xl">
          {formatLatvianDate(date)}
        </span>
        <span
          aria-hidden
          className={`text-xl leading-none text-[var(--accent-deep)] transition-transform sm:text-2xl ${
            open ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute left-0 z-50 mt-2 min-w-[13rem] overflow-hidden rounded-xl border border-[var(--line)] bg-white py-1 shadow-lg"
        >
          {dates.map((d) => (
            <li key={d} role="option" aria-selected={d === date}>
              <button
                type="button"
                className={`block w-full px-4 py-3 text-left text-sm leading-snug ${
                  d === date
                    ? "bg-[var(--bg-soft)] font-semibold text-[var(--bg-deep)]"
                    : "text-[var(--ink-soft)] hover:bg-[var(--bg-soft)]"
                }`}
                onClick={() => goTo(d)}
              >
                {formatLatvianDateShort(d)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PsalmText({ text }: { text: string }) {
  const { refrain, stanzas } = parsePsalmDisplay(text);
  return (
    <div className="mt-4 space-y-6 leading-relaxed">
      {refrain && (
        <p>
          <span className="font-semibold text-[var(--accent-deep)]">
            Refrēns:{" "}
          </span>
          <span className="italic">{refrain}</span>
        </p>
      )}
      {stanzas.map((lines, i) => (
        <div key={i} className="space-y-0">
          {lines.map((line, j) => {
            const isLast = j === lines.length - 1;
            return (
              <p key={j} className="m-0">
                {line}
                {isLast ? (
                  <span className="italic text-[var(--accent-deep)]"> R.</span>
                ) : null}
              </p>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function AlleluiaText({ text }: { text: string }) {
  const { lines } = parseAlleluiaDisplay(text);
  return (
    <div className="mt-4 space-y-0 leading-relaxed">
      {lines.map((line, i) => {
        const isAlleluia = /^Alle?luja\.?$/i.test(line.trim());
        return (
          <p
            key={i}
            className={
              isAlleluia
                ? "m-0 font-semibold text-[var(--accent-deep)]"
                : "m-0"
            }
          >
            {line}
          </p>
        );
      })}
    </div>
  );
}

function ReadingBody({ reading }: { reading: ScriptureReading }) {
  if (reading.role === "psalm") return <PsalmText text={reading.text} />;
  if (reading.role === "alleluia") return <AlleluiaText text={reading.text} />;
  return (
    <p className="mt-4 whitespace-pre-wrap leading-relaxed">{reading.text}</p>
  );
}

const DISCERNMENT_TYPES = new Set([
  "scenario_choice",
  "choose_the_best_response",
]);

const MAX_WRONG_ATTEMPTS = 3;

function seededShuffle<T>(items: T[], seed: number): T[] {
  const copy = [...items];
  let s = seed || 1;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function normalizeGuess(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFC")
    .replace(/[\s\-_.]+/g, "");
}

type QuizQuestion = {
  question: string;
  options: string[];
  correct_answer: number | string;
  explanation?: string;
};

function resolveQuizQuestions(activity: ActivityContent): QuizQuestion[] {
  let list: QuizQuestion[] = [];
  if (activity.questions && activity.questions.length > 0) {
    list = activity.questions.map((q) => ({
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
    }));
  } else if (activity.type === "true_false") {
    const ca = activity.correct_answer;
    list = [
      {
        question:
          (activity.question && activity.question.trim()) ||
          activity.instruction,
        options:
          activity.options && activity.options.length >= 2
            ? activity.options
            : ["Patiess", "Nepatiess"],
        correct_answer:
          typeof ca === "number" || typeof ca === "string" ? ca : 0,
        explanation: activity.explanation,
      },
    ];
  } else if (activity.options && activity.options.length >= 2) {
    const ca = activity.correct_answer;
    list = [
      {
        question:
          (activity.question && activity.question.trim()) ||
          activity.instruction,
        options: activity.options,
        correct_answer:
          typeof ca === "number" || typeof ca === "string" ? ca : 0,
        explanation: activity.explanation,
      },
    ];
  }
  return list.slice(0, 2);
}

function questionCorrectIndex(q: QuizQuestion): number | null {
  if (typeof q.correct_answer === "number") return q.correct_answer;
  if (typeof q.correct_answer === "string") {
    const idx = q.options.findIndex((o) => o === q.correct_answer);
    return idx >= 0 ? idx : null;
  }
  return null;
}

type QuestionPlayState = {
  picked: number | null;
  tried: number[];
  wrongAttempts: number;
  status: "idle" | "wrong" | "correct" | "revealed";
};

function emptyPlayState(): QuestionPlayState {
  return { picked: null, tried: [], wrongAttempts: 0, status: "idle" };
}

function TrueFalseQuiz({
  instruction,
  questions,
}: {
  instruction: string;
  questions: QuizQuestion[];
}) {
  const [plays, setPlays] = useState<QuestionPlayState[]>(() =>
    questions.map(() => emptyPlayState()),
  );

  function choose(qIndex: number, optIndex: number) {
    setPlays((prev) => {
      const cur = prev[qIndex];
      if (!cur || cur.status === "correct" || cur.status === "revealed") {
        return prev;
      }
      const q = questions[qIndex]!;
      const options =
        q.options.length >= 2 ? q.options : ["Patiess", "Nepatiess"];
      const correctIndex = questionCorrectIndex({ ...q, options });
      const next = [...prev];
      next[qIndex] = {
        ...cur,
        picked: optIndex,
        status:
          correctIndex !== null && optIndex === correctIndex
            ? "correct"
            : "revealed",
      };
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <p className="font-medium">{instruction}</p>
      <div className="space-y-5">
        {questions.map((q, qIndex) => {
          const play = plays[qIndex] ?? emptyPlayState();
          const options =
            q.options.length >= 2 ? q.options : ["Patiess", "Nepatiess"];
          const correctIndex = questionCorrectIndex({ ...q, options });
          const answered =
            play.status === "correct" || play.status === "revealed";
          const isCorrect = play.status === "correct";
          const correctLabel =
            correctIndex !== null ? options[correctIndex] ?? null : null;

          return (
            <div
              key={`tf-${qIndex}-${q.question}`}
              className="space-y-3 border-t border-[var(--line)] pt-4 first:border-t-0 first:pt-0"
            >
              {questions.length > 1 && (
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                  {qIndex + 1}.
                </p>
              )}
              <p>{q.question}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {options.map((opt, idx) => {
                  const base = "btn text-left";
                  let cls = `${base} btn-secondary`;
                  if (answered) {
                    if (correctIndex !== null && idx === correctIndex) {
                      cls = `${base} border-2 border-[var(--ok)] bg-[var(--bg-soft)]`;
                    } else if (play.picked === idx) {
                      cls = `${base} border-2 border-[var(--danger)] opacity-80`;
                    } else {
                      cls = `${base} btn-secondary opacity-50`;
                    }
                  }
                  return (
                    <button
                      key={`${qIndex}-${opt}`}
                      type="button"
                      disabled={answered}
                      className={cls}
                      onClick={() => choose(qIndex, idx)}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {answered && (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isCorrect
                      ? "feedback-ok"
                      : "border border-[var(--danger)]/30 bg-red-50/80"
                  }`}
                >
                  {isCorrect ? (
                    <p className="font-medium text-[var(--ok)]">
                      Pareizi —{" "}
                      {correctLabel?.toLowerCase() === "nepatiess"
                        ? "apgalvojums ir nepatiess"
                        : "apgalvojums ir patiess"}
                      .
                    </p>
                  ) : (
                    <p className="font-medium text-[var(--danger)]">
                      Nepareizi — pareizi ir: {correctLabel}.
                    </p>
                  )}
                  {q.explanation && (
                    <p
                      className={`mt-2 ${
                        isCorrect ? "text-[var(--ink-soft)]" : "text-[var(--ink)]"
                      }`}
                    >
                      {q.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MultiChoiceQuiz({
  instruction,
  questions,
}: {
  instruction: string;
  questions: QuizQuestion[];
}) {
  const [plays, setPlays] = useState<QuestionPlayState[]>(() =>
    questions.map(() => emptyPlayState()),
  );

  function checkChoice(qIndex: number, optIndex: number) {
    setPlays((prev) => {
      const cur = prev[qIndex];
      if (!cur || cur.status === "correct" || cur.status === "revealed") {
        return prev;
      }
      const q = questions[qIndex]!;
      const correctIndex = questionCorrectIndex(q);
      const next = [...prev];
      if (correctIndex === null) {
        next[qIndex] = { ...cur, picked: optIndex, status: "revealed" };
        return next;
      }
      if (optIndex === correctIndex) {
        next[qIndex] = { ...cur, picked: optIndex, status: "correct" };
        return next;
      }
      const tried = cur.tried.includes(optIndex)
        ? cur.tried
        : [...cur.tried, optIndex];
      const wrongAttempts = cur.wrongAttempts + 1;
      next[qIndex] = {
        picked: optIndex,
        tried,
        wrongAttempts,
        status: "wrong",
      };
      return next;
    });
  }

  function reveal(qIndex: number) {
    setPlays((prev) => {
      const cur = prev[qIndex];
      if (!cur) return prev;
      const next = [...prev];
      next[qIndex] = { ...cur, status: "revealed" };
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <p className="font-medium">{instruction}</p>
      <div className="space-y-5">
        {questions.map((q, qIndex) => {
          const play = plays[qIndex] ?? emptyPlayState();
          const correctIndex = questionCorrectIndex(q);
          const showSolution =
            play.status === "correct" || play.status === "revealed";
          const canGiveUp =
            play.wrongAttempts >= MAX_WRONG_ATTEMPTS &&
            play.status !== "correct";

          return (
            <div
              key={`mc-${qIndex}-${q.question}`}
              className="space-y-3 border-t border-[var(--line)] pt-4 first:border-t-0 first:pt-0"
            >
              {questions.length > 1 && (
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                  {qIndex + 1}.
                </p>
              )}
              <p>{q.question}</p>
              <div className="grid gap-2">
                {q.options.map((opt, idx) => {
                  const base = "btn text-left";
                  let cls = `${base} btn-secondary`;
                  if (showSolution && correctIndex !== null) {
                    if (idx === correctIndex) {
                      cls = `${base} border-2 border-[var(--ok)] bg-[var(--bg-soft)]`;
                    } else if (play.tried.includes(idx) || play.picked === idx) {
                      cls = `${base} border-2 border-[var(--danger)] opacity-70`;
                    } else {
                      cls = `${base} btn-secondary opacity-50`;
                    }
                  } else if (play.tried.includes(idx)) {
                    cls = `${base} border-2 border-[var(--danger)] opacity-70`;
                  } else if (play.picked === idx && play.status === "wrong") {
                    cls = `${base} border-2 border-[var(--danger)]`;
                  }
                  return (
                    <button
                      key={`${qIndex}-${opt}`}
                      type="button"
                      disabled={showSolution || play.tried.includes(idx)}
                      className={cls}
                      onClick={() => checkChoice(qIndex, idx)}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {play.status === "wrong" && (
                <div className="rounded-2xl border border-[var(--danger)]/30 bg-red-50/80 px-4 py-3 text-sm">
                  <p className="font-medium text-[var(--danger)]">
                    Nepareizi. Mēģini vēlreiz.
                  </p>
                  {canGiveUp && (
                    <button
                      type="button"
                      className="btn btn-secondary mt-3 text-sm"
                      onClick={() => reveal(qIndex)}
                    >
                      Parādīt pareizo atbildi
                    </button>
                  )}
                </div>
              )}

              {showSolution && (
                <div className="feedback-ok rounded-2xl px-4 py-3 text-sm leading-relaxed">
                  {play.status === "correct" ? (
                    <p className="font-medium text-[var(--ok)]">
                      Pareizi — labi darīts!
                    </p>
                  ) : (
                    <p className="font-medium">Pareizā atbilde</p>
                  )}
                  {correctIndex !== null && q.options[correctIndex] && (
                    <p className="mt-1">{q.options[correctIndex]}</p>
                  )}
                  {q.explanation && (
                    <p className="mt-2 text-[var(--ink-soft)]">{q.explanation}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type FillBlankItem = {
  question: string;
  answer: string;
  explanation?: string;
};

function resolveFillBlanks(activity: ActivityContent): FillBlankItem[] {
  if (activity.blanks && activity.blanks.length > 0) {
    return activity.blanks
      .map((b) => ({
        question: b.question,
        answer: b.answer,
        explanation: b.explanation,
      }))
      .slice(0, 3);
  }
  const ans =
    (typeof activity.answer === "string" && activity.answer.trim()) ||
    (typeof activity.correct_answer === "string"
      ? activity.correct_answer
      : "");
  if (!ans) return [];
  return [
    {
      question:
        (activity.question && activity.question.trim()) || activity.instruction,
      answer: ans,
      explanation: activity.explanation,
    },
  ];
}

function FillBlankQuiz({
  instruction,
  blanks,
}: {
  instruction: string;
  blanks: FillBlankItem[];
}) {
  const [values, setValues] = useState<string[]>(() => blanks.map(() => ""));
  const [locked, setLocked] = useState<boolean[]>(() => blanks.map(() => false));
  const [wrong, setWrong] = useState<boolean[]>(() => blanks.map(() => false));
  const [checkedOnce, setCheckedOnce] = useState(false);

  const allDone = locked.length > 0 && locked.every(Boolean);

  function setValue(i: number, v: string) {
    if (locked[i]) return;
    setValues((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
    if (wrong[i]) {
      setWrong((prev) => {
        const next = [...prev];
        next[i] = false;
        return next;
      });
    }
  }

  function checkAll() {
    setCheckedOnce(true);
    setLocked((prevLocked) => {
      const nextLocked = [...prevLocked];
      const nextWrong = blanks.map((_, i) => {
        if (nextLocked[i]) return false;
        const ok =
          normalizeGuess(values[i] ?? "") ===
          normalizeGuess(blanks[i]?.answer ?? "");
        if (ok) nextLocked[i] = true;
        return !ok;
      });
      setWrong(nextWrong);
      return nextLocked;
    });
  }

  return (
    <div className="space-y-4">
      <p className="font-medium">{instruction}</p>
      <div className="space-y-5">
        {blanks.map((b, i) => {
          const isLocked = locked[i];
          const isWrong = wrong[i];
          return (
            <div
              key={`fb-${i}-${b.question}`}
              className="space-y-3 border-t border-[var(--line)] pt-4 first:border-t-0 first:pt-0"
            >
              {blanks.length > 1 && (
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                  {i + 1}.
                </p>
              )}
              <p>{b.question}</p>
              <input
                className={`field max-w-md ${
                  isLocked
                    ? "border-2 border-[var(--ok)] bg-[var(--bg-soft)]"
                    : isWrong
                      ? "border-2 border-[var(--danger)]"
                      : ""
                }`}
                value={values[i] ?? ""}
                disabled={isLocked}
                placeholder="Tava atbilde"
                onChange={(e) => setValue(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !allDone) checkAll();
                }}
              />
              {isLocked && (
                <div className="feedback-ok rounded-2xl px-4 py-3 text-sm leading-relaxed">
                  <p className="font-medium text-[var(--ok)]">Pareizi!</p>
                  {b.explanation && (
                    <p className="mt-1 text-[var(--ink-soft)]">{b.explanation}</p>
                  )}
                </div>
              )}
              {isWrong && !isLocked && (
                <p className="text-sm font-medium text-[var(--danger)]">
                  Nepareizi — mēģini vēlreiz.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {!allDone && (
        <button type="button" className="btn btn-accent" onClick={checkAll}>
          {checkedOnce ? "Pārbaudīt vēlreiz" : "Pārbaudīt"}
        </button>
      )}

      {allDone && (
        <div className="feedback-ok rounded-2xl px-4 py-3 text-sm leading-relaxed">
          <p className="font-medium text-[var(--ok)]">
            Labi darīts — visas tukšās vietas aizpildītas!
          </p>
        </div>
      )}
    </div>
  );
}

function resolveWhoAmIClues(activity: ActivityContent): string[] {
  if (activity.clues && activity.clues.length > 0) {
    return activity.clues.map((c) => c.trim()).filter(Boolean).slice(0, 3);
  }
  const raw =
    (activity.question && activity.question.trim()) ||
    (activity.instruction && activity.instruction.trim()) ||
    "";
  if (!raw) return [];
  const parts = raw
    .split(/\n+|(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return (parts.length > 0 ? parts : [raw]).slice(0, 3);
}

function WhoAmIQuiz({
  clues,
  answer,
  explanation,
}: {
  clues: string[];
  answer: string;
  explanation?: string;
}) {
  const [guess, setGuess] = useState("");
  const [visibleCount, setVisibleCount] = useState(1);
  const [status, setStatus] = useState<"idle" | "wrong" | "correct" | "revealed">(
    "idle",
  );
  const showSolution = status === "correct" || status === "revealed";
  const allCluesVisible = visibleCount >= clues.length;
  const canReveal = allCluesVisible && status === "wrong";

  function check() {
    if (showSolution) return;
    if (normalizeGuess(guess) === normalizeGuess(answer)) {
      setStatus("correct");
      setVisibleCount(clues.length);
      return;
    }
    setStatus("wrong");
    setVisibleCount((n) => Math.min(clues.length, n + 1));
  }

  return (
    <div className="space-y-4">
      <p className="font-medium">Kas es esmu?</p>
      <ol className="list-decimal space-y-2 pl-5">
        {clues.slice(0, visibleCount).map((clue, i) => (
          <li key={`${i}-${clue}`} className="leading-relaxed">
            {clue}
          </li>
        ))}
      </ol>
      {!allCluesVisible && status === "wrong" && (
        <p className="text-sm text-[var(--ink-soft)]">
          Jauns mājiens atvērts — mēģini vēlreiz.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          className="field max-w-xs"
          value={guess}
          disabled={showSolution}
          placeholder="Kas es esmu?"
          onChange={(e) => {
            setGuess(e.target.value);
            if (status === "wrong") setStatus("idle");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !showSolution) check();
          }}
        />
        {!showSolution && (
          <button type="button" className="btn btn-accent" onClick={check}>
            Pārbaudīt
          </button>
        )}
      </div>

      {status === "wrong" && !showSolution && (
        <div className="rounded-2xl border border-[var(--danger)]/30 bg-red-50/80 px-4 py-3 text-sm">
          <p className="font-medium text-[var(--danger)]">Nepareizi.</p>
          {canReveal && (
            <button
              type="button"
              className="btn btn-secondary mt-3 text-sm"
              onClick={() => setStatus("revealed")}
            >
              Parādīt pareizo atbildi
            </button>
          )}
        </div>
      )}

      {showSolution && (
        <div className="feedback-ok rounded-2xl px-4 py-3 text-sm leading-relaxed">
          {status === "correct" ? (
            <p className="font-medium text-[var(--ok)]">Pareizi — labi darīts!</p>
          ) : (
            <p className="font-medium">Pareizā atbilde</p>
          )}
          <p className="mt-1">{answer}</p>
          {explanation && (
            <p className="mt-2 text-[var(--ink-soft)]">{explanation}</p>
          )}
        </div>
      )}
    </div>
  );
}

function ActivityGame({ activity }: { activity: ActivityContent }) {
  const quizQuestions = useMemo(
    () =>
      activity.type === "multiple_choice" || activity.type === "true_false"
        ? resolveQuizQuestions(activity)
        : [],
    [activity],
  );
  const fillBlanks = useMemo(
    () =>
      activity.type === "fill_blank" ? resolveFillBlanks(activity) : [],
    [activity],
  );
  const whoClues = useMemo(
    () =>
      activity.type === "who_am_i" ? resolveWhoAmIClues(activity) : [],
    [activity],
  );
  const whoAnswer = useMemo(() => {
    if (activity.type !== "who_am_i") return "";
    if (typeof activity.answer === "string" && activity.answer.trim()) {
      return activity.answer.trim();
    }
    if (typeof activity.correct_answer === "string") {
      return activity.correct_answer;
    }
    return "";
  }, [activity]);

  const [picked, setPicked] = useState<number | null>(null);
  const [order, setOrder] = useState<string[]>(activity.items ?? []);
  const [blank, setBlank] = useState("");
  const [scrambleGuess, setScrambleGuess] = useState("");
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [triedChoices, setTriedChoices] = useState<number[]>([]);
  const [status, setStatus] = useState<
    "idle" | "wrong" | "correct" | "revealed"
  >("idle");
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matchedLeft, setMatchedLeft] = useState<Set<string>>(() => new Set());
  const [matchedRight, setMatchedRight] = useState<Set<string>>(
    () => new Set(),
  );
  const [matchFlashWrong, setMatchFlashWrong] = useState<{
    left: string;
    right: string;
  } | null>(null);

  const isDiscernment = DISCERNMENT_TYPES.has(activity.type);
  const canGiveUp = wrongAttempts >= MAX_WRONG_ATTEMPTS && status !== "correct";
  const showSolution = status === "correct" || status === "revealed";

  const matchPairs = (activity.pairs ?? []).slice(0, 3);
  const rightColumn = useMemo(() => {
    const pairs = (activity.pairs ?? []).slice(0, 3);
    const rights = pairs.map((p) => p.right);
    const seed = hashSeed(pairs.map((p) => `${p.left}::${p.right}`).join("|"));
    return seededShuffle(rights, seed);
  }, [activity.pairs]);

  const correctRightByLeft = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of (activity.pairs ?? []).slice(0, 3)) map.set(p.left, p.right);
    return map;
  }, [activity.pairs]);
  const correctIndex = useMemo(() => {
    if (typeof activity.correct_answer === "number") return activity.correct_answer;
    if (typeof activity.correct_answer === "string" && activity.options) {
      const idx = activity.options.findIndex((o) => o === activity.correct_answer);
      return idx >= 0 ? idx : null;
    }
    return null;
  }, [activity]);

  const correctLabel = useMemo(() => {
    if (correctIndex !== null && activity.options?.[correctIndex]) {
      return activity.options[correctIndex];
    }
    if (Array.isArray(activity.correct_answer)) {
      return activity.correct_answer.join(" → ");
    }
    if (typeof activity.correct_answer === "string") return activity.correct_answer;
    if (activity.answer) return activity.answer;
    if (activity.type === "matching" && matchPairs.length > 0) {
      return matchPairs.map((p) => `${p.left} — ${p.right}`).join("; ");
    }
    return null;
  }, [activity, correctIndex, matchPairs]);

  const expectedText = useMemo(() => {
    if (activity.answer) return activity.answer;
    if (typeof activity.correct_answer === "string") return activity.correct_answer;
    return null;
  }, [activity]);

  function registerWrong() {
    setWrongAttempts((n) => n + 1);
    setStatus("wrong");
  }

  function registerCorrect() {
    setStatus("correct");
  }

  function checkTextGuess(guess: string) {
    if (!expectedText) {
      setStatus("revealed");
      return;
    }
    if (normalizeGuess(guess) === normalizeGuess(expectedText)) {
      registerCorrect();
    } else {
      registerWrong();
    }
  }

  function checkChoice(idx: number) {
    if (showSolution) return;
    setPicked(idx);
    if (isDiscernment) {
      setStatus("revealed");
      return;
    }
    if (correctIndex === null) {
      setStatus("revealed");
      return;
    }
    if (idx === correctIndex) {
      registerCorrect();
      return;
    }
    if (!triedChoices.includes(idx)) {
      setTriedChoices((prev) => [...prev, idx]);
    }
    registerWrong();
  }

  function checkOrder() {
    const answers = activity.correct_answer;
    if (!Array.isArray(answers)) {
      setStatus("revealed");
      return;
    }
    const ok =
      order.length === answers.length &&
      order.every((item, i) => item === answers[i]);
    if (ok) registerCorrect();
    else registerWrong();
  }

  function revealAnswer() {
    if (activity.type === "matching" && matchPairs.length > 0) {
      setMatchedLeft(new Set(matchPairs.map((p) => p.left)));
      setMatchedRight(new Set(matchPairs.map((p) => p.right)));
      setSelectedLeft(null);
    }
    setStatus("revealed");
  }

  function onMatchLeft(left: string) {
    if (showSolution || matchedLeft.has(left)) return;
    setSelectedLeft(left);
    setMatchFlashWrong(null);
    if (status === "wrong") setStatus("idle");
  }

  function onMatchRight(right: string) {
    if (showSolution || matchedRight.has(right) || !selectedLeft) return;
    const expected = correctRightByLeft.get(selectedLeft);
    if (expected === right) {
      const nextLeft = new Set(matchedLeft);
      nextLeft.add(selectedLeft);
      const nextRight = new Set(matchedRight);
      nextRight.add(right);
      setMatchedLeft(nextLeft);
      setMatchedRight(nextRight);
      setSelectedLeft(null);
      setMatchFlashWrong(null);
      if (nextLeft.size >= matchPairs.length) registerCorrect();
      else if (status === "wrong") setStatus("idle");
      return;
    }
    setMatchFlashWrong({ left: selectedLeft, right });
    registerWrong();
    setSelectedLeft(null);
  }

  function optionClass(idx: number): string {
    const base = "btn text-left";
    if (isDiscernment) {
      if (status === "idle") {
        return `${base} ${picked === idx ? "btn-primary" : "btn-secondary"}`;
      }
      if (correctIndex !== null && idx === correctIndex) {
        return `${base} border-2 border-[var(--ok)] bg-[var(--bg-soft)]`;
      }
      if (picked === idx) return `${base} btn-primary`;
      return `${base} btn-secondary opacity-70`;
    }

    if (showSolution && correctIndex !== null) {
      if (idx === correctIndex) {
        return `${base} border-2 border-[var(--ok)] bg-[var(--bg-soft)]`;
      }
      if (triedChoices.includes(idx) || picked === idx) {
        return `${base} border-2 border-[var(--danger)] opacity-70`;
      }
      return `${base} btn-secondary opacity-50`;
    }

    if (triedChoices.includes(idx)) {
      return `${base} border-2 border-[var(--danger)] opacity-70`;
    }
    if (picked === idx && status === "wrong") {
      return `${base} border-2 border-[var(--danger)]`;
    }
    return `${base} btn-secondary`;
  }

  function matchButtonClass(side: "left" | "right", value: string): string {
    const base = "btn w-full text-left";
    const matched =
      side === "left" ? matchedLeft.has(value) : matchedRight.has(value);
    if (matched) {
      return `${base} border-2 border-[var(--ok)] bg-[var(--bg-soft)]`;
    }
    if (
      matchFlashWrong &&
      ((side === "left" && matchFlashWrong.left === value) ||
        (side === "right" && matchFlashWrong.right === value))
    ) {
      return `${base} border-2 border-[var(--danger)]`;
    }
    if (side === "left" && selectedLeft === value) {
      return `${base} btn-primary`;
    }
    return `${base} btn-secondary`;
  }

  if (activity.type === "multiple_choice" && quizQuestions.length > 0) {
    return (
      <MultiChoiceQuiz
        instruction={activity.instruction}
        questions={quizQuestions}
      />
    );
  }

  if (activity.type === "true_false" && quizQuestions.length > 0) {
    return (
      <TrueFalseQuiz
        instruction={activity.instruction}
        questions={quizQuestions}
      />
    );
  }

  if (activity.type === "fill_blank" && fillBlanks.length > 0) {
    return (
      <FillBlankQuiz
        instruction={activity.instruction}
        blanks={fillBlanks}
      />
    );
  }

  if (activity.type === "who_am_i" && whoClues.length > 0 && whoAnswer) {
    return (
      <WhoAmIQuiz
        clues={whoClues}
        answer={whoAnswer}
        explanation={activity.explanation}
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="font-medium">{activity.instruction}</p>
      {activity.question && <p>{activity.question}</p>}

      {activity.type === "scenario_choice" ||
      activity.type === "choose_the_best_response" ||
      activity.type === "find_the_mistake" ? (
        <div className="grid gap-2">
          {(activity.options ?? []).map((opt, idx) => (
            <button
              key={opt}
              type="button"
              disabled={
                showSolution ||
                (!isDiscernment && triedChoices.includes(idx))
              }
              className={optionClass(idx)}
              onClick={() => checkChoice(idx)}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : null}

      {activity.type === "word_scramble" && (
        <div className="space-y-2">
          <p className="font-mono text-xl tracking-widest">{activity.scrambled}</p>
          <div className="flex flex-wrap gap-2">
            <input
              className="field max-w-xs"
              value={scrambleGuess}
              disabled={showSolution}
              onChange={(e) => {
                setScrambleGuess(e.target.value);
                if (status === "wrong") setStatus("idle");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !showSolution) {
                  checkTextGuess(scrambleGuess);
                }
              }}
            />
            {!showSolution && (
              <button
                type="button"
                className="btn btn-accent"
                onClick={() => checkTextGuess(scrambleGuess)}
              >
                Pārbaudīt
              </button>
            )}
          </div>
        </div>
      )}

      {activity.type === "put_in_order" && (
        <div className="space-y-2">
          {order.map((item, idx) => (
            <div key={`${item}-${idx}`} className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={showSolution || idx === 0}
                onClick={() => {
                  const next = [...order];
                  [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                  setOrder(next);
                  if (status === "wrong") setStatus("idle");
                }}
              >
                ↑
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={showSolution || idx === order.length - 1}
                onClick={() => {
                  const next = [...order];
                  [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                  setOrder(next);
                  if (status === "wrong") setStatus("idle");
                }}
              >
                ↓
              </button>
              <span>{item}</span>
            </div>
          ))}
          {!showSolution && (
            <button
              type="button"
              className="btn btn-accent"
              onClick={checkOrder}
            >
              Pārbaudīt
            </button>
          )}
        </div>
      )}

      {activity.type === "matching" && matchPairs.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-[var(--ink-soft)]">
            Vispirms izvēlies kreiso, tad atbilstošo labo.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              {matchPairs.map((p) => (
                <button
                  key={p.left}
                  type="button"
                  disabled={showSolution || matchedLeft.has(p.left)}
                  className={matchButtonClass("left", p.left)}
                  onClick={() => onMatchLeft(p.left)}
                >
                  {p.left}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {rightColumn.map((right) => (
                <button
                  key={right}
                  type="button"
                  disabled={
                    showSolution || matchedRight.has(right) || !selectedLeft
                  }
                  className={matchButtonClass("right", right)}
                  onClick={() => onMatchRight(right)}
                >
                  {right}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {status === "wrong" && !isDiscernment && (
        <div className="rounded-2xl border border-[var(--danger)]/30 bg-red-50/80 px-4 py-3 text-sm">
          <p className="font-medium text-[var(--danger)]">Nepareizi. Mēģini vēlreiz.</p>
          {canGiveUp && (
            <button
              type="button"
              className="btn btn-secondary mt-3 text-sm"
              onClick={revealAnswer}
            >
              Parādīt pareizo atbildi
            </button>
          )}
        </div>
      )}

      {isDiscernment && status === "revealed" && (
        <div className="feedback-ok rounded-2xl px-4 py-3 text-sm leading-relaxed">
          {correctIndex !== null &&
            picked !== correctIndex &&
            correctLabel && (
              <p className="font-medium text-[var(--bg-deep)]">
                Šodienas Evaņģēlijs aicina uz šo ceļu: {correctLabel}
              </p>
            )}
          {correctIndex !== null && picked === correctIndex && (
            <p className="font-medium text-[var(--ok)]">
              Jā — šī izvēle labi saskan ar šodienas Vārdu.
            </p>
          )}
          {activity.explanation && (
            <p className={correctLabel ? "mt-2" : undefined}>
              {activity.explanation}
            </p>
          )}
        </div>
      )}

      {!isDiscernment && showSolution && (
        <div className="feedback-ok rounded-2xl px-4 py-3 text-sm leading-relaxed">
          {status === "correct" ? (
            <p className="font-medium text-[var(--ok)]">Pareizi — labi darīts!</p>
          ) : (
            <p className="font-medium">Pareizā atbilde</p>
          )}
          {correctLabel && activity.type !== "matching" && (
            <p className="mt-1">
              {activity.type === "put_in_order"
                ? `Secība: ${correctLabel}`
                : correctLabel}
            </p>
          )}
          {activity.type === "matching" && status === "revealed" && (
            <ul className="mt-2 space-y-1">
              {matchPairs.map((p) => (
                <li key={p.left}>
                  <strong>{p.left}</strong> — {p.right}
                </li>
              ))}
            </ul>
          )}
          {activity.explanation && (
            <p className="mt-2 text-[var(--ink-soft)]">{activity.explanation}</p>
          )}
        </div>
      )}
    </div>
  );
}

type TabId = LessonTabId;

function ClassicPrayerClose() {
  return (
    <div className="mt-6 space-y-1 border-t border-[var(--line)] pt-4 text-[var(--ink-soft)] italic leading-relaxed">
      {CLASSIC_PRAYER_LINES.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}

function MorningPanel({
  prayer,
  onContinueToGospel,
}: {
  prayer?: MorningPrayer;
  onContinueToGospel: () => void;
}) {
  return (
    <div className="space-y-5">
      <section className="panel section-enter p-6">
        <SectionHeading icon="morning">Rīta lūgšana</SectionHeading>
        {prayer ? (
          <div className="mt-4 space-y-4 leading-relaxed">
            <p>{prayer.opening}</p>
            <p>{prayer.body}</p>
            <p>{prayer.offering}</p>
            <p>{prayer.closing}</p>
            <ClassicPrayerClose />
          </div>
        ) : (
          <p className="mt-4 text-[var(--ink-soft)]">
            Rīta lūgšana vēl nav ģenerēta. Vecāku skatā ģenerē šodienu no jauna.
          </p>
        )}
        <button
          type="button"
          className="btn btn-primary mt-6"
          onClick={onContinueToGospel}
        >
          Evaņģēlijs
        </button>
      </section>
    </div>
  );
}

function EveningPanel({ prayer }: { prayer?: EveningPrayer }) {
  return (
    <div className="space-y-5">
      <section className="panel section-enter p-6">
        <SectionHeading icon="evening">Vakara lūgšana</SectionHeading>
        {prayer ? (
          <div className="mt-4 space-y-4 leading-relaxed">
            <p>{prayer.thanksgiving}</p>
            <p>{prayer.mercy}</p>
            <div className="mt-2">
              <h3 className="font-semibold text-[var(--bg-deep)]">
                Sirdsapziņas izmeklēšana
              </h3>
              <p className="mt-2 text-[var(--ink-soft)]">{prayer.examen_intro}</p>
              <ol className="mt-3 list-decimal space-y-2 pl-5">
                {prayer.examen_questions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ol>
            </div>
            <p className="font-medium italic leading-relaxed">{prayer.resolution}</p>
            <p>{prayer.closing}</p>
            <ClassicPrayerClose />
          </div>
        ) : (
          <p className="mt-4 text-[var(--ink-soft)]">
            Vakara lūgšana vēl nav ģenerēta. Vecāku skatā ģenerē šodienu no jauna.
          </p>
        )}
      </section>
    </div>
  );
}

function partIcon(
  role: ScriptureReading["role"],
): "book" | "psalm" | "alleluia" {
  if (role === "psalm") return "psalm";
  if (role === "alleluia") return "alleluia";
  return "book";
}

function PartPanel({
  reading,
  insight,
}: {
  reading: ScriptureReading;
  insight?: PartInsight;
}) {
  return (
    <div className="space-y-5">
      <section className="panel section-enter p-6">
        <SectionHeading icon={partIcon(reading.role)}>
          {READING_TAB_LABELS[reading.role || "first_reading"]}
        </SectionHeading>
        {reading.role !== "alleluia" && (
          <p className="mt-2 text-sm text-[var(--accent-deep)]">
            {reading.role === "psalm"
              ? `Psalms ${reading.reference}`
              : `${reading.label} (${reading.reference})`}
          </p>
        )}
        <ReadingBody reading={reading} />
      </section>

      <section className="panel section-enter p-6" style={{ animationDelay: "60ms" }}>
        <SectionHeading icon="overview">Apskats</SectionHeading>
        {insight ? (
          <>
            <p className="mt-3 leading-relaxed">{insight.summary}</p>
            <h3 className="mt-5 font-semibold text-[var(--bg-deep)]">
              Saikne ar Evaņģēliju
            </h3>
            <p className="mt-2 leading-relaxed text-[var(--ink-soft)]">
              {insight.connection_to_gospel}
            </p>
          </>
        ) : (
          <p className="mt-3 text-[var(--ink-soft)]">
            Apskats vēl nav ģenerēts. Vecāku skatā vari ģenerēt šodienas saturu no
            jauna.
          </p>
        )}
      </section>
    </div>
  );
}

export function DailyLessonView({
  date,
  dates,
  displayName,
  childId,
  content,
  readings,
  dailyQuote,
  status,
  isParentPreview,
  isGuest,
  /** 7–9 / 10–12: primary row = Rīts·Evaņģēlijs·Vakars; optional readings on second row */
  splitOptionalReadings,
  gospelAudioUrl,
}: {
  date: string;
  dates: string[];
  displayName: string;
  childId: string;
  content: DailyLessonContent | null;
  readings: ScriptureReading[];
  dailyQuote?: string | null;
  status: string;
  isParentPreview?: boolean;
  isGuest?: boolean;
  splitOptionalReadings?: boolean;
  gospelAudioUrl?: string | null;
}) {
  const gospel = normalizeGospelContent(content);
  const byRole = useMemo(() => {
    const map = new Map<ReadingRole, ScriptureReading>();
    for (const r of readings) {
      if (r.role) map.set(r.role, r);
    }
    return map;
  }, [readings]);

  const tabs = useMemo(() => {
    const middle: ReadingRole[] = [
      "gospel",
      "first_reading",
      "second_reading",
      "psalm",
      "alleluia",
    ];
    const readingTabs = middle.filter((role) => {
      if (role === "gospel") return true;
      return byRole.has(role);
    });
    return ["morning", ...readingTabs, "evening"] as TabId[];
  }, [byRole]);

  const primaryTabs = useMemo(() => {
    if (!splitOptionalReadings) return tabs;
    return tabs.filter(
      (t) => t === "morning" || t === "gospel" || t === "evening",
    );
  }, [tabs, splitOptionalReadings]);

  const optionalTabs = useMemo(() => {
    if (!splitOptionalReadings) return [] as TabId[];
    return tabs.filter(
      (t) => t !== "morning" && t !== "gospel" && t !== "evening",
    );
  }, [tabs, splitOptionalReadings]);

  const [progress, setProgress] = useState<DayProgress>({
    visited: [],
    morningDone: false,
  });
  const [tab, setTab] = useState<TabId>("gospel");
  const [hydrated, setHydrated] = useState(false);
  const scrollToDayStartRef = useRef(false);

  useEffect(() => {
    setHydrated(false);
    const loaded = loadDayProgress(childId, date);
    setProgress(loaded);
    const startMorning =
      Boolean(content?.morning_prayer) && !loaded.morningDone;
    setTab(startMorning ? "morning" : "gospel");
    setHydrated(true);
  }, [childId, date, content?.morning_prayer]);

  useEffect(() => {
    if (!hydrated) return;
    setProgress(markTabVisited(childId, date, tab));
  }, [tab, hydrated, childId, date]);

  const activeTab = tabs.includes(tab) ? tab : "gospel";
  const parts = content?.parts;
  const scriptureGospel = byRole.get("gospel");
  const lessonGospel = status === "success" ? gospel : null;
  const dayLabel = date === todayInRiga() ? "Šodienas" : "Šīs dienas";

  useEffect(() => {
    if (!scrollToDayStartRef.current || activeTab !== "gospel") return;
    scrollToDayStartRef.current = false;
    // Wait for "Šodien" panel to mount after leaving morning prayer.
    requestAnimationFrame(() => {
      document.getElementById("day-start")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [activeTab]);

  function selectTab(next: TabId) {
    setTab(next);
  }

  function continueToGospel() {
    setProgress(markMorningDone(childId, date));
    scrollToDayStartRef.current = true;
    setTab("gospel");
  }

  function tabClass(role: TabId): string {
    const isActive = activeTab === role;
    const visited = progress.visited.includes(role);
    if (isActive) return "lesson-tab lesson-tab-active";
    if (visited) return "lesson-tab lesson-tab-visited";
    return "lesson-tab lesson-tab-idle";
  }

  return (
    <main className="mx-auto max-w-2xl px-6 pb-8 pt-2">
      <section className="flex items-center justify-between gap-3">
        <p className="truncate text-sm leading-none text-[var(--ink-soft)]">
          {isGuest
            ? displayName
            : `Sveiks, ${displayName}${isParentPreview ? " (vecāka skats)" : ""}`}
        </p>
        {isGuest ? (
          <a
            href="/?changeAge=1"
            className="btn btn-secondary shrink-0 !px-3 !py-1.5 text-sm"
          >
            Mainīt vecumu
          </a>
        ) : null}
      </section>

      <section className="section-enter relative z-30 mt-5">
        <DateSwitcher date={date} dates={dates} />
      </section>

      {!lessonGospel && !scriptureGospel ? (
        <section className="panel section-enter mt-8 p-6">
          <h2 className="brand-mark text-2xl">{dayLabel} saturs vēl nav gatavs</h2>
          <p className="mt-3 text-[var(--ink-soft)]">
            {status === "failed"
              ? "Ģenerēšana neizdevās. Vecāku skatā nospied «Ģenerēt šodienu» un mēģini vēlreiz."
              : "Saturs tiek ģenerēts pēc pusnakts ap 00:10 (Latvijas laiks) vai uzreiz pēc profila izveides."}{" "}
            Statuss: {status || "nav"}.
          </p>
        </section>
      ) : !lessonGospel && scriptureGospel ? (
        <>
          <section className="panel panel-day section-enter relative mt-6 overflow-hidden p-6">
            <DayHeroArt />
            <div className="relative z-10">
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--bg-deep)]">
                <span
                  className="inline-block h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_0_4px_rgba(196,163,90,0.25)]"
                  aria-hidden
                />
                {date === todayInRiga() ? "Šodien" : "Šī diena"}
              </p>
              <h2 className="brand-mark mt-2 text-3xl text-[var(--bg-deep)]">
                {scriptureGospel.label || "Evaņģēlijs"}
              </h2>
              {scriptureGospel.reference && (
                <p className="mt-2 text-sm text-[var(--ink)]">
                  {scriptureGospel.reference}
                </p>
              )}
              {dailyQuote && (
                <p className="mt-4 border-l-2 border-[var(--accent)] pl-4 font-medium text-[var(--ink)] italic leading-relaxed">
                  {keepParentheticalsTogether(dailyQuote)}
                </p>
              )}
              <p className="mt-4 text-sm leading-relaxed text-[var(--ink)]">
                {status === "failed"
                  ? `${dayLabel} AI satura ģenerēšana neizdevās. Zemāk joprojām vari lasīt liturģiskos tekstus.`
                  : `${dayLabel} pielāgotais skaidrojums vēl nav gatavs. Zemāk — liturģiskie lasījumi.`}
              </p>
            </div>
          </section>

          <nav
            className="section-enter mt-5 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
            aria-label="Dienas lasījumi"
          >
            {(
              [
                "gospel",
                "first_reading",
                "second_reading",
                "psalm",
                "alleluia",
              ] as ReadingRole[]
            )
              .filter((role) => byRole.has(role))
              .map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => selectTab(role)}
                  className={tabClass(role)}
                >
                  {READING_TAB_LABELS[role]}
                </button>
              ))}
          </nav>

          {byRole.get(activeTab as ReadingRole) || scriptureGospel ? (
            <section className="panel section-enter mt-5 p-6">
              <SectionHeading
                as="h3"
                className="brand-mark section-title text-2xl text-[var(--bg-deep)]"
                icon={
                  (activeTab as ReadingRole) === "psalm"
                    ? "psalm"
                    : (activeTab as ReadingRole) === "alleluia"
                      ? "alleluia"
                      : "book"
                }
              >
                {
                  READING_TAB_LABELS[
                    (byRole.has(activeTab as ReadingRole)
                      ? activeTab
                      : "gospel") as ReadingRole
                  ]
                }
              </SectionHeading>
              {(byRole.get(activeTab as ReadingRole) || scriptureGospel)!
                .reference &&
                (activeTab as ReadingRole) !== "gospel" && (
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">
                    {
                      (byRole.get(activeTab as ReadingRole) || scriptureGospel)!
                        .reference
                    }
                  </p>
                )}
              <div className="mt-4 text-[var(--ink)]">
                <ReadingBody
                  reading={
                    byRole.get(activeTab as ReadingRole) || scriptureGospel!
                  }
                />
              </div>
            </section>
          ) : null}

          {isGuest ? <NotificationSoftPrompt /> : null}
        </>
      ) : (
        <>
          {activeTab !== "morning" && activeTab !== "evening" && (
            <section
              id="day-start"
              className="panel panel-day section-enter relative mt-6 scroll-mt-24 overflow-hidden p-6"
            >
              <DayHeroArt />
              <div className="relative z-10">
                <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--bg-deep)]">
                  <span
                    className="inline-block h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_0_4px_rgba(196,163,90,0.25)]"
                    aria-hidden
                  />
                  Šodien
                </p>
                <h2 className="brand-mark mt-2 text-3xl text-[var(--bg-deep)]">
                  {lessonGospel!.title}
                </h2>
                {dailyQuote && (
                  <p className="mt-4 border-l-2 border-[var(--accent)] pl-4 font-medium text-[var(--ink)] italic leading-relaxed">
                    {keepParentheticalsTogether(dailyQuote)}
                  </p>
                )}
                {content?.day_overview && (
                  <p className="mt-4 leading-relaxed text-[var(--ink)]">
                    {content.day_overview}
                  </p>
                )}
              </div>
            </section>
          )}

          <nav
            className={`section-enter space-y-2 px-1 pb-1 ${
              activeTab === "morning" || activeTab === "evening" ? "mt-6" : "mt-5"
            }`}
            aria-label="Dienas sadaļas"
          >
            <div className="flex flex-wrap gap-2">
              {(splitOptionalReadings ? primaryTabs : tabs).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => selectTab(role)}
                  className={tabClass(role)}
                >
                  {LESSON_TAB_LABELS[role]}
                </button>
              ))}
            </div>
            {splitOptionalReadings && optionalTabs.length > 0 && (
              <div className="flex flex-wrap gap-2" aria-label="Citi lasījumi">
                {optionalTabs.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => selectTab(role)}
                    className={tabClass(role)}
                  >
                    {LESSON_TAB_LABELS[role]}
                  </button>
                ))}
              </div>
            )}
          </nav>

          <div className="mt-5">
            {activeTab === "morning" ? (
              <MorningPanel
                prayer={content?.morning_prayer}
                onContinueToGospel={continueToGospel}
              />
            ) : activeTab === "evening" ? (
              <EveningPanel prayer={content?.evening_prayer} />
            ) : activeTab === "gospel" ? (
              <div className="space-y-5">
                <section className="panel section-enter p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <SectionHeading icon="book">Evaņģēlijs</SectionHeading>
                    {gospelAudioUrl ? (
                      <GospelListenButton audioUrl={gospelAudioUrl} />
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-[var(--accent-deep)]">
                    {lessonGospel!.scripture_reference}
                  </p>
                  <p className="mt-4 whitespace-pre-wrap leading-relaxed">
                    {byRole.get("gospel")?.text ||
                      readings.find((r) => /evaņģēlij/i.test(r.label))?.text ||
                      ""}
                  </p>
                </section>

                <section
                  className="panel section-enter p-6"
                  style={{ animationDelay: "50ms" }}
                >
                  <SectionHeading icon="meaning">Ko tas nozīmē?</SectionHeading>
                  <p className="mt-3 leading-relaxed">{lessonGospel!.explanation}</p>
                  <p className="mt-4 font-medium">{lessonGospel!.main_idea}</p>
                  <p className="mt-3 text-[var(--ink-soft)]">
                    {lessonGospel!.real_life_application}
                  </p>
                </section>

                <section
                  className="panel section-enter p-6"
                  style={{ animationDelay: "100ms" }}
                >
                  <SectionHeading icon="challenge">
                    Šodienas izaicinājums
                  </SectionHeading>
                  <div className="mt-4">
                    <ActivityGame activity={lessonGospel!.activity} />
                  </div>
                </section>

                <section
                  className="panel section-enter p-6"
                  style={{ animationDelay: "150ms" }}
                >
                  <SectionHeading icon="reflect">Pārdomas</SectionHeading>
                  <p className="mt-3 leading-relaxed">
                    {lessonGospel!.reflection_question}
                  </p>
                </section>

                <section
                  className="panel section-enter p-6"
                  style={{ animationDelay: "200ms" }}
                >
                  <SectionHeading icon="pray">Lūgšana</SectionHeading>
                  <p className="mt-3 leading-relaxed italic">{lessonGospel!.prayer}</p>
                </section>
              </div>
            ) : byRole.get(activeTab as ReadingRole) ? (
              <PartPanel
                reading={byRole.get(activeTab as ReadingRole)!}
                insight={
                  activeTab === "first_reading"
                    ? parts?.first_reading
                    : activeTab === "second_reading"
                      ? parts?.second_reading
                      : activeTab === "psalm"
                        ? parts?.psalm
                        : activeTab === "alleluia"
                          ? parts?.alleluia
                          : undefined
                }
              />
            ) : null}
          </div>

          {isGuest ? <NotificationSoftPrompt /> : null}
        </>
      )}
    </main>
  );
}
