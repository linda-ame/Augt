import type { DailyScripture } from "@/lib/types";
import { MieramTuvuSource } from "./mieramtuvu";
import { MieramTuvuEpubSource } from "./mieramtuvu-epub";
import type { ScriptureSource } from "./types";

export type ScriptureSourceMode = "web" | "epub";

/** Default: online scrape. Set MIERAMTUVU_SOURCE=epub for manual EPUB mode. */
export function scriptureSourceMode(): ScriptureSourceMode {
  return process.env.MIERAMTUVU_SOURCE === "epub" ? "epub" : "web";
}

/**
 * Online by default. EPUB only when MIERAMTUVU_SOURCE=epub (manual switch).
 * No automatic fallback — production stays on the website until you opt in.
 */
export class CompositeScriptureSource implements ScriptureSource {
  constructor(
    private readonly mode: ScriptureSourceMode = scriptureSourceMode(),
  ) {}

  async fetchForDate(date: string): Promise<DailyScripture> {
    if (this.mode === "epub") {
      return new MieramTuvuEpubSource().fetchForDate(date);
    }
    return new MieramTuvuSource().fetchForDate(date);
  }
}
