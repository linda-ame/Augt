import { todayInRiga } from "@/lib/dates";
import type { DailyScripture } from "@/lib/types";
import { CompositeScriptureSource } from "./composite";
import type { ScriptureSource } from "./types";

export type { ScriptureSource } from "./types";
export {
  MieramTuvuSource,
  isSiteChromeQuote,
  sanitizeDailyQuote,
  extractPageDate,
} from "./mieramtuvu";
export {
  parseMieramTuvuEpub,
  MieramTuvuEpubSource,
  findEpubPathForDate,
  epubContentDir,
} from "./mieramtuvu-epub";
export {
  CompositeScriptureSource,
  scriptureSourceMode,
} from "./composite";
export {
  importMieramTuvuEpub,
  importMieramTuvuEpubFromPath,
} from "./import-epub";

/** Online by default; EPUB when MIERAMTUVU_SOURCE=epub. */
export function getScriptureSource(): ScriptureSource {
  return new CompositeScriptureSource();
}

export async function fetchTodayScripture(): Promise<DailyScripture> {
  return getScriptureSource().fetchForDate(todayInRiga());
}
