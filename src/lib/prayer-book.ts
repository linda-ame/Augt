import prayersJson from "@/data/faith/prayers.json";
import { CLASSIC_PRAYERS } from "@/lib/classic-prayers";
import type {
  CurriculumBook,
  PrayerBlock,
  PrayerSection,
} from "@/lib/faith-types";

export type PrayerBookItem = {
  id: string;
  title: string;
  subtitle?: string;
  text: string;
};

export type PrayerBookCategory = {
  id: string;
  title: string;
  items: PrayerBookItem[];
};

function linesToText(lines: string[]): string {
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function blockToText(block: PrayerBlock & Record<string, unknown>): string | null {
  if (Array.isArray(block.lines) && block.lines.length) {
    return linesToText(block.lines);
  }
  if (typeof block.content === "string" && block.content.trim()) {
    return block.content.trim();
  }
  const paragraphs = block.paragraphs as
    | { title?: string; text: string }[]
    | undefined;
  if (Array.isArray(paragraphs) && paragraphs.length) {
    return paragraphs
      .map((p) => (p.title ? `${p.title}\n${p.text}` : p.text))
      .join("\n\n")
      .trim();
  }
  // Galda lūgšanas stored as QA pairs where answer is the prayer text
  if (block.id === "galda-lugsanas" && Array.isArray(block.qa)) {
    return null; // handled as multiple items
  }
  return null;
}

function findSection(id: string): PrayerSection | undefined {
  return (prayersJson.sections as PrayerSection[]).find((s) => s.id === id);
}

function expandCitasBlocks(blocks: PrayerBlock[]): PrayerBookItem[] {
  const items: PrayerBookItem[] = [];
  for (const block of blocks) {
    const raw = block as PrayerBlock & Record<string, unknown>;
    if (block.id === "galda-lugsanas" && Array.isArray(block.qa)) {
      for (const q of block.qa) {
        items.push({
          id: `galda-${q.id}`,
          title: q.question,
          text: Array.isArray(q.answer) ? q.answer.join("\n") : q.answer,
        });
      }
      continue;
    }
    const text = blockToText(raw);
    if (!text) continue;
    items.push({
      id: block.id,
      title: block.title,
      subtitle: block.subtitle,
      text,
    });
  }
  return items;
}

/** Teaching Q&A about the main daily prayers (catechism, not the prayer book). */
export function getPrayerTeachings(): {
  id: string;
  title: string;
  subtitle?: string;
  items: { id: string; question: string; answer: string | string[] }[];
}[] {
  const section = findSection("ikdienas");
  if (!section || !("sections" in section)) return [];
  return section.sections
    .filter((b) => Array.isArray(b.qa) && b.qa.length > 0)
    .map((b) => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      items: b.qa!.map((q) => ({
        id: q.id,
        question: q.question,
        answer: q.answer,
      })),
    }));
}

/** Catechism curriculum for Mana ticība → Lūgšanas (same UX as Dievs un ticība). */
export function getPrayersCurriculumBook(): CurriculumBook {
  const par = findSection("par-lugsanu");
  const teachings = getPrayerTeachings();

  const parItems =
    par && "items" in par && Array.isArray(par.items)
      ? par.items.map((item, index) => ({
          id: item.id,
          nr: index + 1,
          q: item.question,
          a: item.answer,
        }))
      : [];

  return {
    title: "Lūgšanas",
    sections: [
      {
        id: "par-lugsanu",
        title: "Par lūgšanu",
        groups: [
          {
            id: "kas-ir-lugsana",
            title: "Kas ir lūgšana",
            items: parItems,
          },
        ],
      },
      {
        id: "skaidrojumi",
        title: "Lūgšanu skaidrojumi",
        groups: teachings.map((block) => ({
          id: block.id,
          title: block.title,
          items: block.items.map((item, index) => ({
            id: item.id,
            nr: index + 1,
            q: item.question,
            a: item.answer,
          })),
        })),
      },
    ],
  };
}

export function getPrayerBook(): PrayerBookCategory[] {
  const ikdienas = findSection("ikdienas");
  const citas = findSection("citas");

  const pamata: PrayerBookItem[] = [];

  // Krusta zīme from catechism data (not in classic list)
  if (ikdienas && "sections" in ikdienas) {
    const krusts = ikdienas.sections.find((b) => b.id === "krusta-zime");
    if (krusts) {
      const text = blockToText(krusts as PrayerBlock & Record<string, unknown>);
      if (text) {
        pamata.push({
          id: krusts.id,
          title: krusts.title,
          subtitle: krusts.subtitle,
          text,
        });
      }
    }
  }

  for (const p of CLASSIC_PRAYERS) {
    pamata.push({
      id: p.id,
      title: p.title,
      text: p.text,
    });
  }

  const citasItems =
    citas && "sections" in citas ? expandCitasBlocks(citas.sections) : [];

  return [
    { id: "pamata", title: "Pamatlūgšanas", items: pamata },
    { id: "citas", title: "Citas lūgšanas", items: citasItems },
  ];
}
