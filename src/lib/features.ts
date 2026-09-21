/**
 * Per-child personalized daily lesson generation.
 * Age-band (guest) generation and child profile drafting are unaffected.
 * Set NEXT_PUBLIC_ENABLE_CHILD_DAILY_GENERATION=true to turn back on.
 */
export function isChildDailyGenerationEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_CHILD_DAILY_GENERATION === "true";
}

export const CHILD_DAILY_GENERATION_PAUSED_MESSAGE =
  "Individuālā satura ģenerēšana pagaidām ir izslēgta. Drīzumā to pieslēgsim.";
