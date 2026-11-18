import { readFile, readdir } from "fs/promises";
import path from "path";
import JSZip from "jszip";
import type { DailyScripture } from "@/lib/types";
import {
  normalizeSpaces,
  parseLiturgicalParts,
  prepareLiturgyBody,
  stripNoise,
} from "./liturgy-parse";
import type { ScriptureSource } from "./types";

const MONTHS_LV: Record<string, number> = {
  janvāris: 1,
  februāris: 2,
  marts: 3,
  aprīlis: 4,
  maijs: 5,
  jūnijs: 6,
  jūlijs: 7,
  augusts: 8,
  septembris: 9,
  oktobris: 10,
  novembris: 11,
  decembris: 12,
};

const MONTH_ALT: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
  sept: 9,
  okt: 10,
  oct: 10,
};

export type EpubDayParse = {
  date: string;
  liturgicalDay?: string;
  dailyQuote?: string;
  readings: DailyScripture["readings"];
  sourceText: string;
};

function xhtmlToPlain(html: string): string {
  let t = html
    .replace(/\u00ad/g, "")
    .replace(/[\u200b\ufeff]/g, "")
    .replace(/\u00a0/g, " ");
  t = t.replace(/<br\s*\/?>/gi, "\n");
  t = t.replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n");
  t = t.replace(/<[^>]+>/g, "");
  t = t
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16)),
    );
  t = t
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n");
  return t.trim();
}

function detectYearMonth(
  opfXml: string,
  fileNameHint: string,
): { year: number; month: number } {
  const fromName = fileNameHint.match(/(20\d{2})[-_.]?(\d{2})/);
  if (fromName) {
    return { year: Number(fromName[1]), month: Number(fromName[2]) };
  }

  const title =
    opfXml.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i)?.[1] ||
    opfXml.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ||
    fileNameHint;

  const yearMatch = title.match(/20\d{2}/);
  const year = yearMatch ? Number(yearMatch[0]) : new Date().getFullYear();

  const lower = title.toLowerCase();
  for (const [name, num] of Object.entries(MONTHS_LV)) {
    if (lower.includes(name)) return { year, month: num };
  }
  for (const [name, num] of Object.entries(MONTH_ALT)) {
    if (new RegExp(`\\b${name}\\b`, "i").test(lower)) {
      return { year, month: num };
    }
  }

  throw new Error(
    `Neizdevās noteikt mēnesi no EPUB (“${title.slice(0, 80)}”). Saglabā kā YYYY-MM.epub.`,
  );
}

function extractDayQuote(dayPlain: string): string | undefined {
  const prepared = prepareLiturgyBody(dayPlain);
  const header = prepared.match(
    /^(\d{1,2}\.\s*\w+,?\s*\w+)\s*\n+([\s\S]*?)(?=\n\s*Rīta\s+lūgšana|\n\s*Dienas\s+lasījumi)/i,
  );
  if (!header?.[2]) return undefined;

  const block = header[2]
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter(
      (l) =>
        !/^Svēt(ais|ā|ie)\b/i.test(l) &&
        !/^Šodien\b/i.test(l) &&
        !/jubileju|sveicam|pieminēt/i.test(l),
    );

  // Prefer motto + scripture cite: "… upuri. (sal. Sak 21, 3)"
  const joined = block.slice(0, 4).join(" ");
  const cited = joined.match(
    /([^.]{8,160}\.)\s*(\((?:sal\.\s*)?[A-Za-zĀČĒĢĪĶĻŅŠŪŽāčēģīķļņšūž][^)]{2,40}\))/u,
  );
  if (cited) {
    return stripNoise(`${cited[1]} ${cited[2]}`);
  }

  // Title-only short line + cite on next line
  if (block.length >= 2) {
    const maybeCite = block.find((l) => /^\([^)]+\)$/.test(l));
    const motto = block.find(
      (l) =>
        l !== maybeCite &&
        l.length >= 8 &&
        l.length <= 160 &&
        !/^\d+\./.test(l),
    );
    if (motto && maybeCite) return stripNoise(`${motto} ${maybeCite}`);
    if (motto) return stripNoise(motto);
  }

  const first = block[0];
  if (first && first.length >= 8 && first.length <= 220) {
    return stripNoise(first);
  }
  return undefined;
}

function parseTocDayLinks(
  tocXml: string,
): Array<{ href: string; fragment: string; monthKey: string; day: number }> {
  const links: Array<{
    href: string;
    fragment: string;
    monthKey: string;
    day: number;
  }> = [];
  const re =
    /content[^>]*src=["']([^"'#]+)#((janvāris|februāris|marts|aprīlis|maijs|jūnijs|jūlijs|augusts|septembris|oktobris|novembris|decembris)-(\d{2}))["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tocXml)) !== null) {
    links.push({
      href: m[1]!,
      fragment: m[2]!,
      monthKey: m[3]!,
      day: Number(m[4]),
    });
  }
  return links;
}

async function readZipText(
  zip: JSZip,
  entryPath: string,
): Promise<string | null> {
  const normalized = entryPath.replace(/^\.\//, "");
  const file =
    zip.file(normalized) ||
    zip.file(normalized.replace(/^OEBPS\//i, "OEBPS/")) ||
    zip.file(Object.keys(zip.files).find((k) => k.endsWith(normalized)) || "");
  if (!file || file.dir) return null;
  return file.async("string");
}

function resolveZipPath(baseHref: string, relative: string): string {
  const baseDir = baseHref.includes("/")
    ? baseHref.slice(0, baseHref.lastIndexOf("/") + 1)
    : "";
  const joined = path.posix.normalize(`${baseDir}${relative}`);
  return joined.replace(/^(\.\.\/)+/, "");
}

/**
 * Parse a Mieram tuvu monthly EPUB into one entry per calendar day.
 */
export async function parseMieramTuvuEpub(
  buffer: Buffer | ArrayBuffer | Uint8Array,
  fileNameHint = "mieramtuvu.epub",
): Promise<EpubDayParse[]> {
  const zip = await JSZip.loadAsync(buffer);
  const names = Object.keys(zip.files);

  const container = await readZipText(zip, "META-INF/container.xml");
  if (!container) throw new Error("EPUB: nav META-INF/container.xml");

  const opfPath =
    container.match(/full-path=["']([^"']+)["']/i)?.[1] ||
    names.find((n) => n.endsWith(".opf"));
  if (!opfPath) throw new Error("EPUB: nav content.opf");

  const opf = await readZipText(zip, opfPath);
  if (!opf) throw new Error(`EPUB: neizdevās lasīt ${opfPath}`);

  const { year, month } = detectYearMonth(opf, fileNameHint);
  const opfDir = opfPath.includes("/")
    ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1)
    : "";

  const tocCandidate =
    names.find((n) => /toc\.ncx$/i.test(n)) ||
    names.find((n) => /toc\.xhtml$/i.test(n));
  if (!tocCandidate) throw new Error("EPUB: nav satura rādītāja (toc)");

  const tocXml = await readZipText(zip, tocCandidate);
  if (!tocXml) throw new Error("EPUB: tukšs toc");

  const links = parseTocDayLinks(tocXml);
  if (links.length === 0) {
    throw new Error(
      "EPUB: netika atrastas dienu saites (gaidīts #septembris-01 u.tml.).",
    );
  }

  const byDate = new Map<string, EpubDayParse>();

  for (const link of links) {
    const monthNum = MONTHS_LV[link.monthKey];
    if (!monthNum || monthNum !== month) continue;

    const date = `${year}-${String(month).padStart(2, "0")}-${String(link.day).padStart(2, "0")}`;
    const xhtmlPath = resolveZipPath(opfDir, link.href);
    const xhtml = await readZipText(zip, xhtmlPath);
    if (!xhtml) {
      throw new Error(`EPUB: trūkst dienas faila ${xhtmlPath} (${date})`);
    }

    const idAttr = `id="${link.fragment}"`;
    const idIdx = xhtml.indexOf(idAttr);
    if (idIdx < 0) {
      throw new Error(`EPUB: nav enkurs ${link.fragment} failā ${xhtmlPath}`);
    }

    // Slice from this day heading to the next section start (or end)
    const from = xhtml.lastIndexOf("<", idIdx);
    let chunk = xhtml.slice(from >= 0 ? from : idIdx);
    const nextSection = chunk
      .slice(120)
      .search(/\sid="[^"]+-\d{2}"|class="[^"]*epub-section-start/i);
    if (nextSection >= 0) {
      chunk = chunk.slice(0, nextSection + 120);
    }

    const plain = xhtmlToPlain(chunk);
    const liturgyStart = plain.search(/Dienas\s+lasījumi/i);
    const liturgyBlock =
      liturgyStart >= 0 ? plain.slice(liturgyStart) : plain;
    const readings = parseLiturgicalParts(liturgyBlock);
    const dailyQuote = extractDayQuote(plain);
    const liturgicalDay = normalizeSpaces(
      plain.match(/^\d{1,2}\.\s*[^\n]+/m)?.[0] || "",
    );

    const sourceText = readings
      .map((r) => `[${r.role}] ${r.label} (${r.reference})\n${r.text}`)
      .join("\n\n");

    byDate.set(date, {
      date,
      liturgicalDay: liturgicalDay || undefined,
      dailyQuote,
      readings,
      sourceText,
    });
  }

  const days = [...byDate.values()].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  if (days.length === 0) {
    throw new Error("EPUB: neizdevās izparsēt nevienu dienu.");
  }
  return days;
}

export function epubContentDir(): string {
  return path.join(process.cwd(), "content", "mieramtuvu");
}

/** Prefer YYYY-MM.epub for the given date. */
export async function findEpubPathForDate(
  date: string,
): Promise<string | null> {
  const ym = date.slice(0, 7); // YYYY-MM
  const dir = epubContentDir();
  const preferred = path.join(dir, `${ym}.epub`);
  try {
    await readFile(preferred);
    return preferred;
  } catch {
    /* try scan */
  }
  try {
    const files = await readdir(dir);
    const match = files.find(
      (f) =>
        f.toLowerCase().endsWith(".epub") &&
        (f.startsWith(ym) || f.includes(ym.replace("-", ""))),
    );
    return match ? path.join(dir, match) : null;
  } catch {
    return null;
  }
}

export class MieramTuvuEpubSource implements ScriptureSource {
  constructor(private readonly epubPath?: string) {}

  async fetchForDate(date: string): Promise<DailyScripture> {
    const filePath =
      this.epubPath || (await findEpubPathForDate(date));
    if (!filePath) {
      throw new Error(
        `Nav Mieram tuvu EPUB mēnesim ${date.slice(0, 7)} (sagaidīts content/mieramtuvu/${date.slice(0, 7)}.epub).`,
      );
    }
    const buf = await readFile(filePath);
    const days = await parseMieramTuvuEpub(buf, path.basename(filePath));
    const day = days.find((d) => d.date === date);
    if (!day) {
      throw new Error(`EPUB ${path.basename(filePath)} nesatur dienu ${date}.`);
    }
    return {
      date: day.date,
      liturgicalDay: day.liturgicalDay,
      dailyQuote: day.dailyQuote,
      sourceUrl: `epub:${path.basename(filePath)}#${date}`,
      readings: day.readings,
      sourceText: day.sourceText,
    };
  }
}
