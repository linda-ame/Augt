"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatLatvianDate, formatLatvianDateShort } from "@/lib/dates";
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

function normalizeGuess(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFC")
    .replace(/[\s\-_.]+/g, "");
}

function ActivityGame({ activity }: { activity: ActivityContent }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [order, setOrder] = useState<string[]>(activity.items ?? []);
  const [blank, setBlank] = useState("");
  const [scrambleGuess, setScrambleGuess] = useState("");
  const [whoGuess, setWhoGuess] = useState("");
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [triedChoices, setTriedChoices] = useState<number[]>([]);
  const [status, setStatus] = useState<
    "idle" | "wrong" | "correct" | "revealed"
  >("idle");

  const isDiscernment = DISCERNMENT_TYPES.has(activity.type);
  const canGiveUp = wrongAttempts >= MAX_WRONG_ATTEMPTS && status !== "correct";
  const showSolution = status === "correct" || status === "revealed";

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
    return null;
  }, [activity, correctIndex]);

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
    setStatus("revealed");
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

  return (
    <div className="space-y-4">
      <p className="font-medium">{activity.instruction}</p>
      {activity.question && <p>{activity.question}</p>}

      {activity.type === "multiple_choice" ||
      activity.type === "true_false" ||
      activity.type === "scenario_choice" ||
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

      {activity.type === "fill_blank" && (
        <div className="flex flex-wrap gap-2">
          <input
            className="field max-w-xs"
            value={blank}
            disabled={showSolution}
            onChange={(e) => {
              setBlank(e.target.value);
              if (status === "wrong") setStatus("idle");
            }}
            placeholder="Tava atbilde"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !showSolution) checkTextGuess(blank);
            }}
          />
          {!showSolution && (
            <button
              type="button"
              className="btn btn-accent"
              onClick={() => checkTextGuess(blank)}
            >
              Pārbaudīt
            </button>
          )}
        </div>
      )}

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

      {activity.type === "matching" && activity.pairs && (
        <div className="space-y-3">
          <ul className="space-y-2">
            {activity.pairs.map((p) => (
              <li
                key={p.left}
                className="rounded-xl border border-[var(--line)] bg-white/70 px-3 py-2"
              >
                <strong>{p.left}</strong> — {p.right}
              </li>
            ))}
          </ul>
          {activity.explanation && status === "idle" && (
            <button
              type="button"
              className="btn btn-accent"
              onClick={() => setStatus("revealed")}
            >
              Parādīt skaidrojumu
            </button>
          )}
        </div>
      )}

      {activity.type === "who_am_i" && (
        <div className="flex flex-wrap gap-2">
          <input
            className="field max-w-xs"
            value={whoGuess}
            disabled={showSolution}
            placeholder="Kas es esmu?"
            onChange={(e) => {
              setWhoGuess(e.target.value);
              if (status === "wrong") setStatus("idle");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !showSolution) checkTextGuess(whoGuess);
            }}
          />
          {!showSolution && (
            <button
              type="button"
              className="btn btn-accent"
              onClick={() => checkTextGuess(whoGuess)}
            >
              Pārbaudīt
            </button>
          )}
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

      {!isDiscernment &&
        activity.type !== "matching" &&
        showSolution && (
        <div className="feedback-ok rounded-2xl px-4 py-3 text-sm leading-relaxed">
          {status === "correct" ? (
            <p className="font-medium text-[var(--ok)]">Pareizi — labi darīts!</p>
          ) : (
            <p className="font-medium">Pareizā atbilde</p>
          )}
          {correctLabel && (
            <p className="mt-1">
              {activity.type === "put_in_order"
                ? `Secība: ${correctLabel}`
                : correctLabel}
            </p>
          )}
          {activity.explanation && (
            <p className="mt-2 text-[var(--ink-soft)]">{activity.explanation}</p>
          )}
        </div>
      )}

      {activity.type === "matching" && status === "revealed" && activity.explanation && (
        <div className="rounded-2xl bg-[var(--bg-soft)] px-4 py-3 text-sm leading-relaxed">
          <p>{activity.explanation}</p>
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

  function selectTab(next: TabId) {
    setTab(next);
  }

  function continueToGospel() {
    setProgress(markMorningDone(childId, date));
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

      {status !== "success" || !gospel ? (
        <section className="panel section-enter mt-8 p-6">
          <h2 className="brand-mark text-2xl">Šodienas saturs vēl nav gatavs</h2>
          <p className="mt-3 text-[var(--ink-soft)]">
            {status === "failed"
              ? "Ģenerēšana neizdevās. Vecāku skatā nospied «Ģenerēt šodienu» un mēģini vēlreiz."
              : "Saturs tiek ģenerēts pēc pusnakts ap 00:10 (Latvijas laiks) vai uzreiz pēc profila izveides."}{" "}
            Statuss: {status || "nav"}.
          </p>
        </section>
      ) : (
        <>
          {activeTab !== "morning" && activeTab !== "evening" && (
            <section className="panel panel-day section-enter relative mt-6 overflow-hidden p-6">
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
                  {gospel.title}
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
                  <SectionHeading icon="book">Evaņģēlijs</SectionHeading>
                  <p className="mt-2 text-sm text-[var(--accent-deep)]">
                    {gospel.scripture_reference}
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
                  <p className="mt-3 leading-relaxed">{gospel.explanation}</p>
                  <p className="mt-4 font-medium">{gospel.main_idea}</p>
                  <p className="mt-3 text-[var(--ink-soft)]">
                    {gospel.real_life_application}
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
                    <ActivityGame activity={gospel.activity} />
                  </div>
                </section>

                <section
                  className="panel section-enter p-6"
                  style={{ animationDelay: "150ms" }}
                >
                  <SectionHeading icon="reflect">Pārdomas</SectionHeading>
                  <p className="mt-3 leading-relaxed">
                    {gospel.reflection_question}
                  </p>
                </section>

                <section
                  className="panel section-enter p-6"
                  style={{ animationDelay: "200ms" }}
                >
                  <SectionHeading icon="pray">Lūgšana</SectionHeading>
                  <p className="mt-3 leading-relaxed italic">{gospel.prayer}</p>
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
