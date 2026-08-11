import { z } from "zod";

export const READING_ROLES = [
  "first_reading",
  "psalm",
  "second_reading",
  "alleluia",
  "gospel",
] as const;

export type ReadingRole = (typeof READING_ROLES)[number];

export const quizQuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).min(2),
  correct_answer: z.union([z.number(), z.string()]),
  explanation: z.string().optional(),
});

export const fillBlankItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  explanation: z.string().optional(),
});

export const activitySchema = z
  .object({
    type: z.string(),
    instruction: z.string().optional(),
    question: z.string().optional(),
    options: z.array(z.string()).optional(),
    correct_answer: z
      .union([z.number(), z.string(), z.array(z.string())])
      .optional(),
    explanation: z.string().optional(),
    items: z.array(z.string()).optional(),
    pairs: z
      .array(z.object({ left: z.string(), right: z.string() }))
      .optional(),
    scrambled: z.string().optional(),
    answer: z.string().optional(),
    /** multiple_choice / true_false */
    questions: z.array(quizQuestionSchema).optional(),
    /** fill_blank: 2–3 Gospel blanks */
    blanks: z.array(fillBlankItemSchema).optional(),
    /** who_am_i: progressive clues (2–3) */
    clues: z.array(z.string().min(1)).min(1).max(3).optional(),
  })
  .transform((a) => {
    const instruction =
      (a.instruction && a.instruction.trim()) ||
      (a.question && a.question.trim()) ||
      "Izpildi uzdevumu.";

    let questions = a.questions;
    const needsSynth =
      (a.type === "multiple_choice" || a.type === "true_false") &&
      (!questions || questions.length === 0);

    if (needsSynth) {
      const ca = a.correct_answer;
      const options =
        a.options && a.options.length >= 2
          ? a.options
          : a.type === "true_false"
            ? ["Patiess", "Nepatiess"]
            : null;
      if (options) {
        questions = [
          {
            question: (a.question && a.question.trim()) || instruction,
            options,
            correct_answer:
              typeof ca === "number" || typeof ca === "string" ? ca : 0,
            explanation: a.explanation,
          },
        ];
      }
    }

    let blanks = a.blanks;
    if (
      a.type === "fill_blank" &&
      (!blanks || blanks.length === 0) &&
      (a.answer || typeof a.correct_answer === "string")
    ) {
      const ans =
        (typeof a.answer === "string" && a.answer.trim()) ||
        (typeof a.correct_answer === "string" ? a.correct_answer : "");
      if (ans) {
        blanks = [
          {
            question: (a.question && a.question.trim()) || instruction,
            answer: ans,
            explanation: a.explanation,
          },
        ];
      }
    }

    let clues = a.clues;
    if (a.type === "who_am_i" && (!clues || clues.length === 0)) {
      const raw =
        (a.question && a.question.trim()) ||
        (a.instruction && a.instruction.trim()) ||
        "";
      if (raw) {
        const parts = raw
          .split(/\n+|(?<=\.)\s+/)
          .map((s) => s.trim())
          .filter(Boolean);
        clues = (parts.length > 0 ? parts : [raw]).slice(0, 3);
      }
    }

    return { ...a, instruction, questions, blanks, clues };
  });

export const gospelContentSchema = z.object({
  title: z.string().min(1),
  scripture_reference: z.string().min(1),
  explanation: z.string().min(1),
  main_idea: z.string().min(1),
  real_life_application: z.string().min(1),
  activity: activitySchema,
  reflection_question: z.string().min(1),
  prayer: z.string().min(1),
});

export const partInsightSchema = z.object({
  summary: z.string().min(1),
  connection_to_gospel: z.string().min(1),
});

export const morningPrayerSchema = z.object({
  opening: z.string().min(1),
  body: z.string().min(1),
  offering: z.string().min(1),
  closing: z.string().min(1),
});

export const eveningPrayerSchema = z.object({
  thanksgiving: z.string().min(1),
  mercy: z.string().min(1),
  examen_intro: z.string().min(1),
  examen_questions: z.array(z.string().min(1)).min(3).max(6),
  resolution: z.string().min(1),
  closing: z.string().min(1),
});

export const dailyLessonContentSchema = z
  .object({
    // Short overview of the whole liturgical day (shown above tabs)
    day_overview: z.string().optional(),
    morning_prayer: morningPrayerSchema.optional(),
    evening_prayer: eveningPrayerSchema.optional(),
    // New shape
    gospel: gospelContentSchema.optional(),
    parts: z
      .object({
        first_reading: partInsightSchema.optional(),
        psalm: partInsightSchema.optional(),
        second_reading: partInsightSchema.optional(),
        alleluia: partInsightSchema.optional(),
      })
      .optional(),
    // Legacy flat shape (older generated lessons)
    title: z.string().optional(),
    scripture_reference: z.string().optional(),
    explanation: z.string().optional(),
    main_idea: z.string().optional(),
    real_life_application: z.string().optional(),
    activity: activitySchema.optional(),
    reflection_question: z.string().optional(),
    prayer: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    const hasGospel = Boolean(val.gospel);
    const hasLegacy =
      Boolean(val.title) &&
      Boolean(val.explanation) &&
      Boolean(val.activity) &&
      Boolean(val.prayer);
    if (!hasGospel && !hasLegacy) {
      ctx.addIssue({
        code: "custom",
        message: "Nepieciešams gospel vai legacy saturs.",
      });
    }
  });

export type DailyLessonContent = z.infer<typeof dailyLessonContentSchema>;
export type GospelContent = z.infer<typeof gospelContentSchema>;
export type PartInsight = z.infer<typeof partInsightSchema>;
export type ActivityContent = z.infer<typeof activitySchema>;
export type MorningPrayer = z.infer<typeof morningPrayerSchema>;
export type EveningPrayer = z.infer<typeof eveningPrayerSchema>;

export type ScriptureReading = {
  role?: ReadingRole;
  label: string;
  reference: string;
  text: string;
};

export type DailyScripture = {
  date: string;
  liturgicalDay?: string;
  dailyQuote?: string;
  sourceUrl: string;
  readings: ScriptureReading[];
  sourceText: string;
};

export function normalizeGospelContent(
  content: DailyLessonContent | null,
): GospelContent | null {
  if (!content) return null;
  if (content.gospel) return content.gospel;
  if (
    content.title &&
    content.scripture_reference &&
    content.explanation &&
    content.main_idea &&
    content.real_life_application &&
    content.activity &&
    content.reflection_question &&
    content.prayer
  ) {
    return {
      title: content.title,
      scripture_reference: content.scripture_reference,
      explanation: content.explanation,
      main_idea: content.main_idea,
      real_life_application: content.real_life_application,
      activity: content.activity,
      reflection_question: content.reflection_question,
      prayer: content.prayer,
    };
  }
  return null;
}

export type LessonTabId = ReadingRole | "morning" | "evening";

export const READING_TAB_LABELS: Record<ReadingRole, string> = {
  gospel: "Evaņģēlijs",
  first_reading: "1. lasījums",
  second_reading: "2. lasījums",
  psalm: "Psalms",
  alleluia: "Alleluja",
};

export const LESSON_TAB_LABELS: Record<LessonTabId, string> = {
  morning: "Rīts",
  ...READING_TAB_LABELS,
  evening: "Vakars",
};

/** Fixed classic prayer cues (not AI-generated full texts). */
export const CLASSIC_PRAYER_LINES = [
  "Tēvs mūsu…",
  "Esi sveicināta…",
  "Gods lai ir…",
  "Es ticu…",
] as const;
