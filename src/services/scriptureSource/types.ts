import type { DailyScripture } from "@/lib/types";

export interface ScriptureSource {
  fetchForDate(date: string): Promise<DailyScripture>;
}
