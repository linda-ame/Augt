import { formatInTimeZone } from "date-fns-tz";
import { subDays, parseISO, isAfter, isBefore, startOfDay } from "date-fns";

export const RIGA_TZ = "Europe/Riga";

const WEEKDAYS_LV = [
  "Svētdiena",
  "Pirmdiena",
  "Otrdiena",
  "Trešdiena",
  "Ceturtdiena",
  "Piektdiena",
  "Sestdiena",
] as const;

/** Nominative month names (date-fns `lv` uses locative: augustā, pirmdienā). */
const MONTHS_LV = [
  "janvāris",
  "februāris",
  "marts",
  "aprīlis",
  "maijs",
  "jūnijs",
  "jūlijs",
  "augusts",
  "septembris",
  "oktobris",
  "novembris",
  "decembris",
] as const;

function partsInRiga(dateStr: string) {
  const iso = parseISO(dateStr);
  const year = Number(formatInTimeZone(iso, RIGA_TZ, "yyyy"));
  const month = Number(formatInTimeZone(iso, RIGA_TZ, "M")); // 1–12
  const day = Number(formatInTimeZone(iso, RIGA_TZ, "d"));
  const weekday = Number(formatInTimeZone(iso, RIGA_TZ, "i")); // 1=Mon … 7=Sun in date-fns
  // Convert ISO weekday to JS Sunday=0 index used by WEEKDAYS_LV
  const weekdayIndex = weekday === 7 ? 0 : weekday;
  return { year, month, day, weekdayIndex };
}

export function todayInRiga(date = new Date()): string {
  return formatInTimeZone(date, RIGA_TZ, "yyyy-MM-dd");
}

/** e.g. "Pirmdiena, 2026. gada 10. augusts" (nominative, not pirmdienā/augustā) */
export function formatLatvianDate(dateStr: string): string {
  const { year, month, day, weekdayIndex } = partsInRiga(dateStr);
  return `${WEEKDAYS_LV[weekdayIndex]}, ${year}. gada ${day}. ${MONTHS_LV[month - 1]}`;
}

/** Shorter label for history dropdown: "10. augusts 2026" */
export function formatLatvianDateShort(dateStr: string): string {
  const { year, month, day } = partsInRiga(dateStr);
  return `${day}. ${MONTHS_LV[month - 1]} ${year}`;
}

/** Allowed: today and up to 7 days in the past (Europe/Riga calendar days). */
export function isReadableDate(dateStr: string, now = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const today = todayInRiga(now);
  const min = formatInTimeZone(
    subDays(parseISO(today), 7),
    RIGA_TZ,
    "yyyy-MM-dd",
  );
  return dateStr <= today && dateStr >= min;
}

export function assertReadableDate(dateStr: string, now = new Date()): void {
  if (!isReadableDate(dateStr, now)) {
    throw new Error(
      "Datums nav pieejams. Var skatīt tikai šodienu un līdz 7 dienas atpakaļ.",
    );
  }
}

export function pastWeekDates(now = new Date()): string[] {
  const today = todayInRiga(now);
  const dates: string[] = [];
  for (let i = 0; i <= 7; i++) {
    dates.push(
      formatInTimeZone(subDays(parseISO(today), i), RIGA_TZ, "yyyy-MM-dd"),
    );
  }
  return dates;
}

export function isFutureDate(dateStr: string, now = new Date()): boolean {
  const today = startOfDay(parseISO(todayInRiga(now)));
  const d = startOfDay(parseISO(dateStr));
  return isAfter(d, today);
}

export function isOlderThanWeek(dateStr: string, now = new Date()): boolean {
  const min = startOfDay(parseISO(pastWeekDates(now)[7]));
  const d = startOfDay(parseISO(dateStr));
  return isBefore(d, min);
}
