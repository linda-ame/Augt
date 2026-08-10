import { notFound, redirect } from "next/navigation";
import { resolveActiveChild } from "@/lib/active-child";
import { FaithPageFrame } from "@/components/faith/FaithPageFrame";
import { getCurriculumTopic } from "@/lib/faith-curriculum";

export default async function CurriculumSectionPage({
  params,
}: {
  params: Promise<{ topic: string; section: string }>;
}) {
  const active = await resolveActiveChild();
  if (!active) redirect("/");

  const { topic, section: sectionId } = await params;
  const entry = getCurriculumTopic(topic);
  if (!entry) redirect("/kid/faith/learn");

  const section = entry.book.sections.find((s) => s.id === sectionId);
  if (!section) notFound();

  return (
    <FaithPageFrame
      pageTitle={section.title}
      backHref={`/kid/faith/learn/${topic}`}
      backLabel={`← ${entry.title}`}
    >
      <div className="faith-grid">
        {section.groups.map((group) => (
          <a
            key={group.id}
            className="faith-card"
            href={`/kid/faith/learn/${topic}/${section.id}/${group.id}`}
          >
            {group.title}
          </a>
        ))}
      </div>
    </FaithPageFrame>
  );
}
