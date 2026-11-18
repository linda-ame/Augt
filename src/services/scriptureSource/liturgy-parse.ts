import type { ReadingRole, ScriptureReading } from "@/lib/types";

export function normalizeSpaces(text: string): string {
  return text
    .replace(/\u00ad/g, "") // soft hyphen (common in EPUB)
    .replace(/[\u200b\ufeff]/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Cut reading at liturgical close.
 * First reading usually ends with "Tas ir Dieva Vārds.";
 * Gospel with "Tas ir Kunga Vārds." — keep that phrase, drop Mass prayers after.
 */
export function truncateReadingText(
  text: string,
  role?: ReadingRole,
): string {
  let t = normalizeSpaces(text);

  t = t.split(
    /Lūgšana pār upurdāvanām|Upurēšanas lūgšana|Upurdāvanu lūgšana|Komūnijas antifona|Pēckomūnijas lūgšana|Credo|Ticības apliecinājums|Vispārīgā lūgšana|Ticīgo lūgšana/i,
  )[0];

  const gospelClose = /Tas ir Kunga Vārds\.?/i;
  const readingClose = /Tas ir Dieva Vārds\.?/i;

  if (role === "gospel") {
    const m = t.match(gospelClose) || t.match(readingClose);
    if (m && m.index !== undefined) {
      t = t.slice(0, m.index + m[0].length).trim();
    }
    if (!/Tas ir Kunga Vārds\.?\s*$/i.test(t)) {
      t = `${t.replace(/\s*Tas ir Dieva Vārds\.?\s*$/i, "").trim()} Tas ir Kunga Vārds.`;
    }
    return t.trim();
  }

  if (role === "first_reading" || role === "second_reading") {
    const m = t.match(readingClose) || t.match(gospelClose);
    if (m && m.index !== undefined) {
      t = t.slice(0, m.index + m[0].length).trim();
    }
    if (
      !/Tas ir Dieva Vārds\.?\s*$/i.test(t) &&
      !/Tas ir Kunga Vārds\.?\s*$/i.test(t)
    ) {
      t = `${t.trim()} Tas ir Dieva Vārds.`;
    }
    return t.trim();
  }

  return t.trim();
}

export function stripNoise(text: string): string {
  return normalizeSpaces(text)
    .replace(/Tas ir Dieva Vārds\.?/gi, "")
    .replace(/Tas ir Kunga Vārds\.?/gi, "")
    .trim();
}

function classifyRole(
  label: string,
  reference: string,
  index: number,
  total: number,
): ReadingRole {
  if (/Evaņģēlij/i.test(label) || /^(Mt|Mk|Lk|Jņ|Jn)\b/i.test(reference)) {
    return "gospel";
  }
  if (index === total - 1) return "gospel";
  if (index === 0) return "first_reading";
  return "second_reading";
}

/** Join "Lasījums no …\ngramatas (Ref)" EPUB line breaks before parsing. */
export function prepareLiturgyBody(text: string): string {
  let t = text
    .replace(/\u00ad/g, "")
    .replace(/[\u200b\ufeff]/g, "")
    .replace(/\u00a0/g, " ");
  // Collapse soft-hyphen leftovers / odd spaces in section titles
  t = t.replace(/Dienas\s+lasījumi/gi, "Dienas lasījumi");
  t = t.replace(
    /(Lasījums no [^\n(]{0,100})\n+\s*/gi,
    (_, head: string) => `${head.replace(/\s+/g, " ")} `,
  );
  return t;
}

/**
 * Parse first/second reading, psalm (or “Dziedājums”), alleluia, gospel
 * from a plain-text liturgy block.
 */
export function parseLiturgicalParts(bodyText: string): ScriptureReading[] {
  const prepared = prepareLiturgyBody(bodyText);
  const startIdx = prepared.search(
    /Lasījums no|Atbildes psalms|Dziedājums|Alleluja|Psalms/i,
  );
  if (startIdx < 0) {
    throw new Error(
      "Neizdevās atrast publisko sadaļu „Svēto Rakstu lasījumi”.",
    );
  }

  let haystack = prepared.slice(startIdx);
  haystack = haystack.split(
    /Lūgšana pār upurdāvanām|Upurēšanas lūgšana|Komūnijas antifona|Pēckomūnijas lūgšana|Rīta lūgšana|Vakara lūgšana|Pārdomām|Pārdomas/i,
  )[0];

  const readings: ScriptureReading[] = [];

  const psalmMatch = haystack.match(
    /(?:Atbildes\s+)?(?:Psalms?|Dziedājums)\s+([^\n]+?)\s*\n+([\s\S]*?)(?=\n\s*Lasījums no |\n\s*Alleluja|\n\s*Alēluja|$)/i,
  );

  const readingRe =
    /Lasījums no ([^\n(]+)\(([^)]+)\)\s*([\s\S]*?)(?=Lasījums no |(?:Atbildes\s+)?(?:Psalms?|Dziedājums)|Alleluja|Alēluja|Lūgšana pār upurdāvanām|Komūnijas|$)/gi;

  const rawBlocks: Array<{ label: string; reference: string; text: string }> =
    [];
  let match: RegExpExecArray | null;
  while ((match = readingRe.exec(haystack)) !== null) {
    const label = normalizeSpaces(`Lasījums no ${match[1].trim()}`);
    const reference = match[2].trim();
    let text = normalizeSpaces(match[3]);
    text = text.split(
      /Atbildes psalms|Dziedājums|Alleluja|Alēluja|Evaņģēlija aicinājums|Lūgšana pār upurdāvanām/i,
    )[0];
    text = normalizeSpaces(text);
    if (reference && text.length > 30) {
      rawBlocks.push({ label, reference, text });
    }
  }

  const alleluiaMatch = haystack.match(
    /(Alle?luja\.?\s*\n[\s\S]*?Alle?luja\.?)(?=\s*\n\s*Lasījums no |\s*\n\s*Lūgšana pār upurdāvanām|\s*\n\s*Komūnijas|$)/i,
  );

  for (let i = 0; i < rawBlocks.length; i++) {
    const b = rawBlocks[i]!;
    const role = classifyRole(b.label, b.reference, i, rawBlocks.length);
    readings.push({
      role,
      label: b.label,
      reference: b.reference,
      text: truncateReadingText(b.text, role),
    });
  }

  const gospels = readings.filter((r) => r.role === "gospel");
  if (gospels.length === 0 && readings.length > 0) {
    readings[readings.length - 1]!.role = "gospel";
    readings[readings.length - 1]!.text = truncateReadingText(
      readings[readings.length - 1]!.text,
      "gospel",
    );
  }
  if (readings.length >= 3) {
    const nonGospel = readings.filter((r) => r.role !== "gospel");
    if (nonGospel.length >= 2) {
      nonGospel[0]!.role = "first_reading";
      nonGospel[1]!.role = "second_reading";
      nonGospel[0]!.text = truncateReadingText(
        nonGospel[0]!.text,
        "first_reading",
      );
      nonGospel[1]!.text = truncateReadingText(
        nonGospel[1]!.text,
        "second_reading",
      );
    }
  } else if (readings.length === 2) {
    readings[0]!.role = "first_reading";
    readings[1]!.role = "gospel";
    readings[0]!.text = truncateReadingText(
      readings[0]!.text,
      "first_reading",
    );
    readings[1]!.text = truncateReadingText(readings[1]!.text, "gospel");
  }

  if (psalmMatch) {
    const ref = normalizeSpaces(psalmMatch[1] || "Psalms");
    const text = (psalmMatch[2] || "")
      .split("\n")
      .map((line) => line.replace(/[ \t]+/g, " ").trim())
      .filter(Boolean)
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (text.length > 20) {
      readings.push({
        role: "psalm",
        label: /Dziedājums/i.test(psalmMatch[0] || "")
          ? "Dziedājums"
          : "Atbildes psalms",
        reference: ref || "Psalms",
        text,
      });
    }
  }

  if (alleluiaMatch) {
    let text = (alleluiaMatch[1] || "")
      .split(/Lasījums no |Lūgšana pār upurdāvanām/i)[0]
      .split("\n")
      .map((line) => line.replace(/[ \t]+/g, " ").trim())
      .filter(Boolean)
      .join("\n")
      .trim()
      .slice(0, 800);
    if (text.length > 10) {
      readings.push({
        role: "alleluia",
        label: "Alleluja",
        reference: "Alleluja",
        text,
      });
    }
  }

  const order: ReadingRole[] = [
    "first_reading",
    "psalm",
    "second_reading",
    "alleluia",
    "gospel",
  ];
  readings.sort(
    (a, b) =>
      order.indexOf(a.role || "gospel") - order.indexOf(b.role || "gospel"),
  );

  if (readings.length === 0) {
    throw new Error("Neizdevās izparsēt Svēto Rakstu lasījumus.");
  }
  return readings;
}
