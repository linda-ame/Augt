/** Expand common Latvian gospel abbreviations for natural TTS. */

function replaceBook(
  text: string,
  abbrev: string,
  spoken: string,
): string {
  // Avoid \b — it breaks on Latvian letters (ņ, etc.).
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])${abbrev}\\.?(?=[^\\p{L}\\p{N}]|$)`, "giu");
  return text.replace(re, `$1${spoken}`);
}

/**
 * Make scripture refs speakable, e.g.
 * "Mt 18, 15-20" → "Mateja evaņģēlijs 18. nodaļa, 15. līdz 20. pants"
 */
export function speakableScriptureReference(raw: string): string {
  let text = raw.trim();
  if (!text) return text;

  // Longer / diacritic forms first
  text = replaceBook(text, "Jņ", "Jāņa evaņģēlijs");
  text = replaceBook(text, "Jn", "Jāņa evaņģēlijs");
  text = replaceBook(text, "Mt", "Mateja evaņģēlijs");
  text = replaceBook(text, "Mk", "Marka evaņģēlijs");
  text = replaceBook(text, "Lk", "Lūkas evaņģēlijs");

  // "18, 15-20" or "18,15–20" after book name
  text = text.replace(
    /(\d+)\s*,\s*(\d+)\s*[-–—]\s*(\d+)/g,
    "$1. nodaļa, $2. līdz $3. pants",
  );
  // "18, 15" single verse
  text = text.replace(/(\d+)\s*,\s*(\d+)(?!\s*\.?\s*līdz)/g, "$1. nodaļa, $2. pants");

  // Prefer "līdz" over hyphen left in ranges elsewhere
  text = text.replace(/(\d+)\s*[-–—]\s*(\d+)/g, "$1 līdz $2");

  return text.replace(/\s{2,}/g, " ").trim();
}
