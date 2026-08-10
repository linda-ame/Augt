export type CurriculumItem = {
  nr: number;
  q: string;
  a: string | string[];
  id?: string | number;
};

export type CurriculumGroup = {
  id: string;
  title: string;
  range?: string;
  items: CurriculumItem[];
};

export type CurriculumSection = {
  id: string;
  title: string;
  range?: string;
  groups: CurriculumGroup[];
};

export type CurriculumBook = {
  title: string;
  range?: string;
  sections: CurriculumSection[];
};

export type BasicsSection = {
  id: string;
  title: string;
  lines?: string[];
  content?: string;
};

export type PrayerQaItem = {
  id: string;
  question: string;
  answer: string | string[];
};

export type PrayerBlock = {
  id: string;
  title: string;
  subtitle?: string;
  lines?: string[];
  content?: string;
  qa?: PrayerQaItem[];
};

export type PrayerSection =
  | {
      id: string;
      title: string;
      type: "qa";
      items: PrayerQaItem[];
    }
  | {
      id: string;
      title: string;
      type?: "list" | string;
      sections: PrayerBlock[];
      items?: never;
    };

export function answerLines(a: string | string[]): string[] {
  return Array.isArray(a) ? a : [a];
}

export function flattenCurriculum(book: CurriculumBook) {
  const flat: { sectionId: string; groupId: string; sectionTitle: string; groupTitle: string }[] =
    [];
  book.sections.forEach((section) => {
    section.groups.forEach((group) => {
      flat.push({
        sectionId: section.id,
        groupId: group.id,
        sectionTitle: section.title,
        groupTitle: group.title,
      });
    });
  });
  return flat;
}
