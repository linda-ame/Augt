import {
  normalizeGospelContent,
  type DailyLessonContent,
} from "@/lib/types";
import { speakableScriptureReference } from "@/lib/speakable-scripture";

/** Gospel-first spoken script for one age-band listen file. */
export function buildGospelListenScript(
  content: DailyLessonContent,
  options?: { gospelReadingText?: string | null },
): string | null {
  const gospel = normalizeGospelContent(content);
  if (!gospel) return null;

  const reading = (options?.gospelReadingText ?? "").trim();
  const parts = [
    `Šodienas Evaņģēlijs. ${gospel.title}.`,
    speakableScriptureReference(gospel.scripture_reference),
    reading || null,
    "Ko tas nozīmē?",
    gospel.explanation,
    gospel.main_idea,
    "Pārdomām.",
    gospel.reflection_question,
    "Lūgšana.",
    gospel.prayer,
  ].filter((p): p is string => Boolean(p && p.trim()));

  return parts.join("\n\n");
}
