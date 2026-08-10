import { notFound, redirect } from "next/navigation";
import { resolveActiveChild } from "@/lib/active-child";
import { FaithPageFrame } from "@/components/faith/FaithPageFrame";
import { CurriculumLesson } from "@/components/faith/CurriculumLesson";
import { getPrayersCurriculumBook } from "@/lib/prayer-book";

export default async function PrayerCurriculumLessonPage({
  params,
}: {
  params: Promise<{ section: string; group: string }>;
}) {
  const active = await resolveActiveChild();
  if (!active) redirect("/");

  const { section, group } = await params;
  const book = getPrayersCurriculumBook();
  const sectionData = book.sections.find((s) => s.id === section);
  const groupData = sectionData?.groups.find((g) => g.id === group);
  if (!sectionData || !groupData) notFound();

  return (
    <FaithPageFrame
      pageTitle={groupData.title}
      backHref="/kid/faith/learn/prayers"
      backLabel="← Lūgšanas"
    >
      <CurriculumLesson
        book={book}
        basePath="/kid/faith/learn/prayers"
        sectionId={section}
        groupId={group}
      />

      {section === "skaidrojumi" ? (
        <p className="mt-4 text-sm text-[var(--ink-soft)]">
          <a
            className="font-semibold text-[var(--bg-deep)] underline"
            href={`/kid/prayers?cat=pamata&id=${prayerBookIdForTeaching(group)}`}
          >
            Skatīt lūgšanu →
          </a>
        </p>
      ) : (
        <p className="mt-4 text-sm text-[var(--ink-soft)]">
          <a
            className="font-semibold text-[var(--bg-deep)] underline"
            href="/kid/prayers"
          >
            Atvērt lūgšanu grāmatu →
          </a>
        </p>
      )}
    </FaithPageFrame>
  );
}

function prayerBookIdForTeaching(groupId: string): string {
  switch (groupId) {
    case "tevs-musu":
      return "our_father";
    case "esi-sveicinata":
      return "hail_mary";
    case "gods-tevam":
      return "glory_be";
    case "es-ticu":
      return "creed";
    default:
      return groupId;
  }
}
