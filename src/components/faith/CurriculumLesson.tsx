import { FaithAccordion } from "@/components/faith/FaithAccordion";
import { FaithSectionPager } from "@/components/faith/FaithSectionPager";
import {
  flattenCurriculum,
  type CurriculumBook,
} from "@/lib/faith-types";

export function CurriculumLesson({
  book,
  basePath,
  sectionId,
  groupId,
}: {
  book: CurriculumBook;
  basePath: string;
  sectionId: string;
  groupId: string;
}) {
  const sectionIndex = book.sections.findIndex((s) => s.id === sectionId);
  const section = book.sections[sectionIndex];
  if (!section) {
    return <p className="text-[var(--ink-soft)]">Sadaļa nav atrasta.</p>;
  }

  const groupIndex = section.groups.findIndex((g) => g.id === groupId);
  const group = section.groups[groupIndex];
  if (!group) {
    return <p className="text-[var(--ink-soft)]">Apakšsadaļa nav atrasta.</p>;
  }

  const flat = flattenCurriculum(book);
  const flatIndex = flat.findIndex(
    (f) => f.sectionId === sectionId && f.groupId === groupId,
  );
  const prev = flatIndex > 0 ? flat[flatIndex - 1] : null;
  const next =
    flatIndex >= 0 && flatIndex < flat.length - 1 ? flat[flatIndex + 1] : null;

  return (
    <div>
      <p className="faith-lesson-section">{section.title}</p>

      <FaithAccordion
        items={group.items.map((item) => ({
          key: String(item.id ?? item.nr),
          question: `${item.nr}. ${item.q}`,
          answer: item.a,
        }))}
      />

      <FaithSectionPager
        prev={
          prev
            ? {
                href: `${basePath}/${prev.sectionId}/${prev.groupId}`,
                label: prev.groupTitle,
              }
            : null
        }
        next={
          next
            ? {
                href: `${basePath}/${next.sectionId}/${next.groupId}`,
                label: next.groupTitle,
              }
            : null
        }
      />
    </div>
  );
}
