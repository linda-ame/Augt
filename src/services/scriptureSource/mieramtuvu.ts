import * as cheerio from "cheerio";
import type {
  DailyScripture,
  ReadingRole,
  ScriptureReading,
} from "@/lib/types";
import { todayInRiga } from "@/lib/dates";

export interface ScriptureSource {
  fetchForDate(date: string): Promise<DailyScripture>;
}

const BASE = "https://mieramtuvu.lv/lasit/";

function normalizeSpaces(text: string): string {
  return text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Cut reading at liturgical close.
 * First reading usually ends with "Tas ir Dieva Vārds.";
 * Gospel with "Tas ir Kunga Vārds." — keep that phrase, drop Mass prayers after.
 */
function truncateReadingText(text: string, role?: ReadingRole): string {
  let t = normalizeSpaces(text);

  // Never include later Mass sections
  t = t.split(
    /Lūgšana pār upurdāvanām|Upurēšanas lūgšana|Upurdāvanu lūgšana|Komūnijas antifona|Pēckomūnijas lūgšana|Credo|Ticības apliecinājums|Vispārīgā lūgšana|Ticīgo lūgšana/i,
  )[0];

  const gospelClose = /Tas ir Kunga Vārds\.?/i;
  const readingClose = /Tas ir Dieva Vārds\.?/i;

  if (role === "gospel") {
    const m = t.match(gospelClose) || t.match(readingClose);
    if (m && m.index !== undefined) {
      t = t.slice(0, m.index + m[0].length).trim();
    }
    // Gospel always closes with this formula
    if (!/Tas ir Kunga Vārds\.?\s*$/i.test(t)) {
      t = `${t.replace(/\s*Tas ir Dieva Vārds\.?\s*$/i, "").trim()} Tas ir Kunga Vārds.`;
    }
    return t.trim();
  }

  if (role === "first_reading" || role === "second_reading") {
    const m = t.match(readingClose) || t.match(gospelClose);
    if (m && m.index !== undefined) {
      t = t.slice(0, m.index + m[0].length).trim();
    }
    if (
      !/Tas ir Dieva Vārds\.?\s*$/i.test(t) &&
      !/Tas ir Kunga Vārds\.?\s*$/i.test(t)
    ) {
      t = `${t.trim()} Tas ir Dieva Vārds.`;
    }
    return t.trim();
  }

  return t.trim();
}

function stripNoise(text: string): string {
  // Used for quotes / labels — not for full reading bodies
  return normalizeSpaces(text)
    .replace(/Tas ir Dieva Vārds\.?/gi, "")
    .replace(/Tas ir Kunga Vārds\.?/gi, "")
    .trim();
}

/** Preserve <br>/<p> structure so psalm verses and Alleluja stay readable. */
function htmlToPlainWithBreaks(html: string): string {
  const $ = cheerio.load(`<div id="augt-root">${html}</div>`);
  $("#augt-root br").replaceWith("\n");
  $("#augt-root p, #augt-root div, #augt-root li").each((_, el) => {
    $(el).append("\n");
  });
  let text = $("#augt-root").text();
  text = text
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text;
}

function extractAccordionSection(
  $: cheerio.CheerioAPI,
  titleRe: RegExp,
): string {
  let best = "";
  $("h5.eltdf-accordion-title, .eltdf-accordion-title").each((_, el) => {
    const title = $(el).text().replace(/\s+/g, " ").trim();
    if (!titleRe.test(title)) return;
    const next = $(el).next(".eltdf-accordion-content");
    const html = next.html() || "";
    const content = html ? htmlToPlainWithBreaks(html) : next.text();
    if (content && content.length > best.length) best = content;
  });
  return best;
}

function extractDailyQuote($: cheerio.CheerioAPI, html: string): string | undefined {
  // Prefer short italic / block-like lines near the top of the page
  const candidates: string[] = [];
  $("em, i, blockquote, .mt-wrapper p").each((_, el) => {
    const t = stripNoise($(el).text());
    if (t.length >= 20 && t.length <= 220) candidates.push(t);
  });

  // Heuristic: first short distinctive line that is not a heading/nav
  for (const c of candidates.slice(0, 12)) {
    if (/abonement|Mēnesim|Pieslēgties|Dalīties/i.test(c)) continue;
    if (/Lasījums no|Evaņģēlij|Psalms|Alleluja/i.test(c)) continue;
    return c;
  }

  // Fallback: look for a line after a date-like pattern in raw HTML text
  const plain = cheerio.load(html).text().replace(/\s+/g, " ");
  const m = plain.match(
    /\d{4}\.?\s*(gada)?\s*\d{1,2}\.?\s*\w+\s+([“"«][^”"»]{15,180}[”"»]|[^.]{25,160}\.)/i,
  );
  if (m?.[2]) return stripNoise(m[2]);
  return undefined;
}

function classifyRole(
  label: string,
  reference: string,
  index: number,
  total: number,
): ReadingRole {
  const blob = `${label} ${reference}`.toLowerCase();
  if (/evaņģēlij|evangelij|jņ|jn |mt |mk |lk |matej|mark|luk|jān/i.test(blob)) {
    return "gospel";
  }
  if (/psalm|ps\s*\d/i.test(blob)) return "psalm";
  if (/allelu|alēluj|aleluj/i.test(blob)) return "alleluia";
  // Last non-psalm reading is usually gospel if not already classified
  if (index === total - 1) return "gospel";
  if (index === 0) return "first_reading";
  return "second_reading";
}

function parseLiturgicalParts(bodyText: string): ScriptureReading[] {
  const startIdx = bodyText.search(/Lasījums no|Atbildes psalms|Alleluja|Psalms/i);
  if (startIdx < 0) {
    throw new Error("Neizdevās atrast publisko sadaļu „Svēto Rakstu lasījumi”.");
  }

  let haystack = bodyText.slice(startIdx);
  haystack = haystack.split(
    /Lūgšana pār upurdāvanām|Upurēšanas lūgšana|Komūnijas antifona|Pēckomūnijas lūgšana|Rīta lūgšana|Vakara lūgšana|Pārdomas/i,
  )[0];

  const readings: ScriptureReading[] = [];

  // Psalm block — keep newlines; reference like "112 (111)" or "Ps 23"
  const psalmMatch = haystack.match(
    /(?:Atbildes\s+)?Psalms?\s+([^\n]+?)\s*\n+([\s\S]*?)(?=\n\s*Lasījums no |\n\s*Alleluja|\n\s*Alēluja|$)/i,
  );
  // Gospel / reading blocks
  const readingRe =
    /Lasījums no ([^\n(]+)\(([^)]+)\)\s*([\s\S]*?)(?=Lasījums no |(?:Atbildes\s+)?Psalms?|Alleluja|Alēluja|Lūgšana pār upurdāvanām|Komūnijas|$)/gi;

  const rawBlocks: Array<{ label: string; reference: string; text: string }> =
    [];
  let match: RegExpExecArray | null;
  while ((match = readingRe.exec(haystack)) !== null) {
    const label = normalizeSpaces(`Lasījums no ${match[1].trim()}`);
    const reference = match[2].trim();
    let text = normalizeSpaces(match[3]);
    text = text.split(
      /Atbildes psalms|Alleluja|Alēluja|Evaņģēlija aicinājums|Lūgšana pār upurdāvanām/i,
    )[0];
    text = normalizeSpaces(text);
    if (reference && text.length > 30) {
      rawBlocks.push({ label, reference, text });
    }
  }

  // Alleluia — keep bookend "Alleluja." lines; stop before gospel
  const alleluiaMatch = haystack.match(
    /(Alle?luja\.?\s*\n[\s\S]*?Alle?luja\.?)(?=\s*\n\s*Lasījums no |\s*\n\s*Lūgšana pār upurdāvanām|\s*\n\s*Komūnijas|$)/i,
  );

  for (let i = 0; i < rawBlocks.length; i++) {
    const b = rawBlocks[i];
    const role = classifyRole(b.label, b.reference, i, rawBlocks.length);
    readings.push({
      role,
      label: b.label,
      reference: b.reference,
      text: truncateReadingText(b.text, role),
    });
  }

  // Ensure roles uniqueness / fix second reading when 3+ blocks
  const gospels = readings.filter((r) => r.role === "gospel");
  if (gospels.length === 0 && readings.length > 0) {
    readings[readings.length - 1].role = "gospel";
    readings[readings.length - 1].text = truncateReadingText(
      readings[readings.length - 1].text,
      "gospel",
    );
  }
  if (readings.length >= 3) {
    const nonGospel = readings.filter((r) => r.role !== "gospel");
    if (nonGospel.length >= 2) {
      nonGospel[0].role = "first_reading";
      nonGospel[1].role = "second_reading";
      nonGospel[0].text = truncateReadingText(
        nonGospel[0].text,
        "first_reading",
      );
      nonGospel[1].text = truncateReadingText(
        nonGospel[1].text,
        "second_reading",
      );
    }
  } else if (readings.length === 2) {
    readings[0].role = "first_reading";
    readings[1].role = "gospel";
    readings[0].text = truncateReadingText(readings[0].text, "first_reading");
    readings[1].text = truncateReadingText(readings[1].text, "gospel");
  }

  if (psalmMatch) {
    const ref = normalizeSpaces(psalmMatch[1] || "Psalms");
    // Preserve verse line breaks; only tidy spaces within lines
    const text = (psalmMatch[2] || "")
      .split("\n")
      .map((line) => line.replace(/[ \t]+/g, " ").trim())
      .filter(Boolean)
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (text.length > 20) {
      readings.push({
        role: "psalm",
        label: "Atbildes psalms",
        reference: ref || "Psalms",
        text,
      });
    }
  }

  if (alleluiaMatch) {
    let text = (alleluiaMatch[1] || "")
      .split(/Lasījums no |Lūgšana pār upurdāvanām/i)[0]
      .split("\n")
      .map((line) => line.replace(/[ \t]+/g, " ").trim())
      .filter(Boolean)
      .join("\n")
      .trim()
      .slice(0, 800);
    if (text.length > 10) {
      readings.push({
        role: "alleluia",
        label: "Alleluja",
        reference: "Alleluja",
        text,
      });
    }
  }

  // Stable order for UI
  const order: ReadingRole[] = [
    "first_reading",
    "psalm",
    "second_reading",
    "alleluia",
    "gospel",
  ];
  readings.sort(
    (a, b) =>
      order.indexOf(a.role || "gospel") - order.indexOf(b.role || "gospel"),
  );

  if (readings.length === 0) {
    throw new Error("Neizdevās izparsēt Svēto Rakstu lasījumus.");
  }
  return readings;
}

function parseFromHtml(html: string): {
  readings: ScriptureReading[];
  dailyQuote?: string;
} {
  const $ = cheerio.load(html);
  const accordion = extractAccordionSection($, /Svēto Rakstu lasījumi/i);
  const bodyText = accordion || $.text();
  const readings = parseLiturgicalParts(bodyText);
  const dailyQuote = extractDailyQuote($, html);
  return { readings, dailyQuote };
}

export class MieramTuvuSource implements ScriptureSource {
  async fetchForDate(date: string): Promise<DailyScripture> {
    const candidates = [
      `${BASE}?date=${date}`,
      `${BASE}?diena=${date}`,
      BASE,
    ];
    if (date === todayInRiga()) candidates.unshift(BASE);

    let lastError: unknown;
    const tried = new Set<string>();
    for (const url of candidates) {
      if (tried.has(url)) continue;
      tried.add(url);
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent":
              "AugtBot/1.0 (+family faith app; public Scripture readings only)",
            Accept: "text/html",
          },
          cache: "no-store",
        });
        if (!res.ok) {
          lastError = new Error(`HTTP ${res.status} no ${url}`);
          continue;
        }
        const html = await res.text();
        if (!/Lasījums no/i.test(html) && !/Svēto Rakstu lasījumi/i.test(html)) {
          lastError = new Error("Lapa nesatur lasījumu tekstu.");
          continue;
        }
        const { readings, dailyQuote } = parseFromHtml(html);
        const sourceText = readings
          .map((r) => `[${r.role}] ${r.label} (${r.reference})\n${r.text}`)
          .join("\n\n");
        return {
          date,
          sourceUrl: url,
          readings,
          sourceText,
          dailyQuote,
        };
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Neizdevās ielādēt Mieram tuvu lasījumus.");
  }
}

export function getScriptureSource(): ScriptureSource {
  return new MieramTuvuSource();
}

export async function fetchTodayScripture(): Promise<DailyScripture> {
  return getScriptureSource().fetchForDate(todayInRiga());
}
