/**
 * Keep text inside (…) on one line (e.g. quote citations like (Ps 112, 1–6)).
 * The rest of the sentence may still wrap normally.
 */
export function keepParentheticalsTogether(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\([^)]*\)/g, (chunk) => chunk.replace(/ /g, "\u00a0"));
}
