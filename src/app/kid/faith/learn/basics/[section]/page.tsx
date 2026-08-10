import { redirect, notFound } from "next/navigation";
import { resolveActiveChild } from "@/lib/active-child";
import { FaithPageFrame } from "@/components/faith/FaithPageFrame";
import { FaithSectionPager } from "@/components/faith/FaithSectionPager";
import basicsJson from "@/data/faith/basics.json";
import type { BasicsSection } from "@/lib/faith-types";

export default async function BasicsSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const active = await resolveActiveChild();
  if (!active) redirect("/");

  const { section: sectionId } = await params;
  const sections = basicsJson.sections as BasicsSection[];
  const index = sections.findIndex((s) => s.id === sectionId);
  const section = sections[index];
  if (!section) notFound();

  const prev = index > 0 ? sections[index - 1] : null;
  const next = index < sections.length - 1 ? sections[index + 1] : null;

  return (
    <FaithPageFrame
      pageTitle={section.title}
      backHref="/kid/faith/learn/basics"
      backLabel="← Ticības pamati"
    >
      <div className="faith-basics-content">
        {section.lines?.map((line) => (
          <p key={line.slice(0, 48)}>{line}</p>
        ))}
        {section.content ? <p>{section.content}</p> : null}
      </div>

      <FaithSectionPager
        prev={
          prev
            ? {
                href: `/kid/faith/learn/basics/${prev.id}`,
                label: prev.title,
              }
            : null
        }
        next={
          next
            ? {
                href: `/kid/faith/learn/basics/${next.id}`,
                label: next.title,
              }
            : null
        }
      />
    </FaithPageFrame>
  );
}
