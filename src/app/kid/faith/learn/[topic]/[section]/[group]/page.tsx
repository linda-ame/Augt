import { redirect } from "next/navigation";
import { resolveActiveChild } from "@/lib/active-child";
import { FaithPageFrame } from "@/components/faith/FaithPageFrame";
import { CurriculumLesson } from "@/components/faith/CurriculumLesson";
import { getCurriculumTopic } from "@/lib/faith-curriculum";

export default async function CurriculumLessonPage({
  params,
}: {
  params: Promise<{ topic: string; section: string; group: string }>;
}) {
  const active = await resolveActiveChild();
  if (!active) redirect("/");

  const { topic, section, group } = await params;
  const entry = getCurriculumTopic(topic);
  if (!entry) redirect("/kid/faith/learn");

  const sectionData = entry.book.sections.find((s) => s.id === section);
  const pageTitle =
    sectionData?.groups.find((g) => g.id === group)?.title ?? entry.title;

  return (
    <FaithPageFrame
      pageTitle={pageTitle}
      backHref={`/kid/faith/learn/${topic}`}
      backLabel={`← ${entry.title}`}
    >
      <CurriculumLesson
        book={entry.book}
        basePath={`/kid/faith/learn/${topic}`}
        sectionId={section}
        groupId={group}
      />
    </FaithPageFrame>
  );
}
