/** Display helpers for psalm / alleluia (Mieram tuvu style). */

export type PsalmDisplay = {
  refrain?: string;
  /** Each stanza = array of verse lines (as on mieramtuvu.lv). */
  stanzas: string[][];
};

export type AlleluiaDisplay = {
  lines: string[];
};

/** Soften collapsed text: "nabagus.Svētīgs" → "nabagus.\n\nSvētīgs" */
function softenFlatLiturgical(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/([.!?])([A-ZĀČĒĢĪĶĻŅŠŪŽ])/g, "$1\n\n$2")
    .replace(/\s*R\s*\./g, " R.")
    .replace(/\s+/g, (m) => (m.includes("\n") ? m : " "))
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function linesOf(block: string): string[] {
  return block
    .split(/\n+/)
    .map((line) => line.replace(/\s*R\.\s*$/i, "").trim())
    .filter(Boolean);
}

export function parsePsalmDisplay(raw: string): PsalmDisplay {
  let text = raw.replace(/\u00a0/g, " ").trim();
  if (!text.includes("\n")) {
    text = softenFlatLiturgical(text);
  }

  let refrain: string | undefined;
  const refrainMatch = text.match(/^Refrēns:\s*([^\n]+)/i);
  if (refrainMatch) {
    refrain = refrainMatch[1].replace(/\s+/g, " ").trim();
    text = text.slice(refrainMatch[0].length).trim();
  }

  // Stanzas end with " R." (congregation response)
  const chunks = text
    .split(/\s*R\.\s*/i)
    .map((c) => c.trim())
    .filter(Boolean);

  const stanzas = chunks.map(linesOf).filter((s) => s.length > 0);

  return { refrain, stanzas };
}

export function parseAlleluiaDisplay(raw: string): AlleluiaDisplay {
  let text = raw.replace(/\u00a0/g, " ").trim();
  if (!text.includes("\n")) {
    text = softenFlatLiturgical(text);
  }

  const body = text
    .replace(/^Alle?luja\.?\s*/i, "")
    .replace(/\s*Alle?luja\.?\s*$/i, "")
    .trim();

  const verseLines = body
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (verseLines.length === 0 && body) {
    verseLines.push(body.replace(/\s+/g, " "));
  }

  return {
    lines: ["Alleluja.", ...verseLines, "Alleluja."],
  };
}
