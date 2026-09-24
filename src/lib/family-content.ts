/** Fixed evening-circle questions for Ģimene (not AI-generated). */

export const FAMILY_MODE_ID = "family" as const;

export const FIXED_FAMILY_EVENING_QUESTIONS = [
  "Par ko tu šodien pateicies Dievam?",
  "Kas šodien bija labs? Kas bija grūts?",
  "Ja vēlies — kur tu šodien varēji būt labāks?",
  "Par ko īpašu tu šovakar gribi palūgties?",
] as const;

export function isFamilyModeId(
  value: string | null | undefined,
): value is typeof FAMILY_MODE_ID {
  return value === FAMILY_MODE_ID;
}
