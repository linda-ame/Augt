"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { formatLatvianDate, formatLatvianDateShort } from "@/lib/dates";
import { DayHeroArt } from "@/components/DayHeroArt";
import { SectionHeading } from "@/components/SectionHeading";
import { keepParentheticalsTogether } from "@/lib/citation";
import {
  parseAlleluiaDisplay,
  parsePsalmDisplay,
} from "@/lib/liturgical-format";
import {
  READING_TAB_LABELS,
  type ReadingRole,
  type ScriptureReading,
} from "@/lib/types";
import { getAgeBand, type AgeBandId } from "@/lib/age-bands";
import { NotificationSoftPrompt } from "@/components/NotificationSoftPrompt";

const GUEST_TABS: Array<"gospel" | "first_reading" | "psalm" | "alleluia"> = [
  "gospel",
  "first_reading",
  "psalm",
  "alleluia",
];

function DateSwitcher({ date, dates }: { date: string; dates: string[] }) {
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
    const url = new URL(window.location.href);
    url.searchParams.set("date", d);
    window.location.href = url.toString();
  }

  return (
    <div ref={rootRef} className="relative inline-block max-w-full">
      <button
        type="button"
        className="inline-flex max-w-full items-center gap-2 text-left"
        aria-haspopup="listbox"
        aria-expanded={open}
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
          className="absolute left-0 z-40 mt-2 max-h-72 min-w-[14rem] overflow-auto rounded-2xl border border-[var(--line)] bg-[var(--bg-cream)] py-2 shadow-lg"
        >
          {dates.map((d) => (
            <li key={d}>
              <button
                type="button"
                role="option"
                aria-selected={d === date}
                className={`w-full px-4 py-2.5 text-left text-sm ${
                  d === date
                    ? "bg-[var(--bg-deep)] text-white"
                    : "text-[var(--ink)] hover:bg-[var(--bg-soft)]"
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

function ReadingBody({ reading }: { reading: ScriptureReading }) {
  const role = reading.role;
  if (role === "psalm") {
    const p = parsePsalmDisplay(reading.text);
    return (
      <div className="space-y-4 leading-relaxed whitespace-pre-wrap">
        {p.antiphon && (
          <p className="italic text-[var(--ink-soft)]">{p.antiphon}</p>
        )}
        <p>{p.body}</p>
      </div>
    );
  }
  if (role === "alleluia") {
    const a = parseAlleluiaDisplay(reading.text);
    return (
      <div className="space-y-3 leading-relaxed whitespace-pre-wrap">
        {a.lines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    );
  }
  return (
    <p className="leading-relaxed whitespace-pre-wrap">{reading.text}</p>
  );
}

export function GuestDayView({
  date,
  dates,
  ageBandId,
  readings,
  dailyQuote,
  generationStatus,
}: {
  date: string;
  dates: string[];
  ageBandId: AgeBandId;
  readings: ScriptureReading[];
  dailyQuote: string | null;
  generationStatus?: string;
}) {
  const band = getAgeBand(ageBandId);
  const byRole = useMemo(() => {
    const map = new Map<ReadingRole, ScriptureReading>();
    for (const r of readings) {
      if (r.role && !map.has(r.role)) map.set(r.role, r);
    }
    return map;
  }, [readings]);

  const availableTabs = GUEST_TABS.filter((t) => byRole.has(t));
  const [tab, setTab] = useState<(typeof GUEST_TABS)[number]>("gospel");

  useEffect(() => {
    if (availableTabs.length && !availableTabs.includes(tab)) {
      setTab(availableTabs[0]!);
    }
  }, [availableTabs, tab]);

  const active = byRole.get(tab) ?? byRole.get("gospel") ?? readings[0] ?? null;
  const gospel = byRole.get("gospel");

  return (
    <main className="relative mx-auto max-w-2xl px-6 pb-8 pt-2">
      <section className="flex items-center justify-between gap-3">
        <p className="text-sm leading-none text-[var(--ink-soft)]">{band.label}</p>
        <Link
          href="/?changeAge=1"
          className="btn btn-secondary shrink-0 !px-3 !py-1.5 text-sm"
        >
          Mainīt vecumu
        </Link>
      </section>

      <section className="section-enter relative z-30 mt-5">
        <DateSwitcher date={date} dates={dates} />
      </section>

      {!gospel ? (
        <section className="panel section-enter mt-8 p-6">
          <h2 className="brand-mark text-2xl">Lasījumi vēl nav pieejami</h2>
          <p className="mt-3 text-[var(--ink-soft)]">
            Šodienas liturģiskie teksti vēl nav ielādēti. Mēģini vēlāk vai citu
            datumu.
          </p>
        </section>
      ) : (
        <>
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
                {gospel.label || "Evaņģēlijs"}
              </h2>
              {gospel.reference && (
                <p className="mt-2 text-sm text-[var(--ink)]">
                  {gospel.reference}
                </p>
              )}
              {dailyQuote && (
                <p className="mt-4 border-l-2 border-[var(--accent)] pl-4 font-medium text-[var(--ink)] italic leading-relaxed">
                  {keepParentheticalsTogether(dailyQuote)}
                </p>
              )}
              <p className="mt-4 text-sm leading-relaxed text-[var(--ink)]">
                {generationStatus === "failed"
                  ? "Šodienas AI satura ģenerēšana neizdevās. Zemāk joprojām vari lasīt liturģiskos tekstus."
                  : generationStatus === "pending"
                    ? "Vecuma grupai pielāgotais saturs vēl tiek ģenerēts. Zemāk — šodienas lasījumi."
                    : "Vecuma grupai pielāgotais skaidrojums vēl nav gatavs (parasti no rīta ap 6:00). Zemāk — šodienas lasījumi."}
              </p>
            </div>
          </section>

          <nav
            className="section-enter mt-5 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
            aria-label="Dienas lasījumi"
          >
            {availableTabs.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setTab(role)}
                className={`lesson-tab ${
                  tab === role ? "lesson-tab-active" : "lesson-tab-idle"
                }`}
              >
                {READING_TAB_LABELS[role]}
              </button>
            ))}
          </nav>

          {active && (
            <section className="panel section-enter mt-5 p-6">
              <SectionHeading
                as="h3"
                className="brand-mark section-title text-2xl text-[var(--bg-deep)]"
                icon={
                  active.role === "psalm"
                    ? "psalm"
                    : active.role === "alleluia"
                      ? "alleluia"
                      : "book"
                }
              >
                {READING_TAB_LABELS[active.role ?? "gospel"]}
              </SectionHeading>
              {active.reference && active.role !== "gospel" && (
                <p className="mt-1 text-sm text-[var(--ink-soft)]">
                  {active.reference}
                </p>
              )}
              <div className="mt-4 text-[var(--ink)]">
                <ReadingBody reading={active} />
              </div>
            </section>
          )}

          <NotificationSoftPrompt />
        </>
      )}
    </main>
  );
}
