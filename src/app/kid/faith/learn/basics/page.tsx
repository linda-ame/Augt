import { redirect } from "next/navigation";
import { resolveActiveChild } from "@/lib/active-child";
import { FaithPageFrame } from "@/components/faith/FaithPageFrame";
import { FaithTopicLinkList } from "@/components/faith/FaithTopicLinkList";
import basicsJson from "@/data/faith/basics.json";
import type { BasicsSection } from "@/lib/faith-types";

export default async function BasicsHubPage() {
  const active = await resolveActiveChild();
  if (!active) redirect("/");

  const sections = basicsJson.sections as BasicsSection[];

  return (
    <FaithPageFrame
      pageTitle="Ticības pamati"
      backHref="/kid/faith/learn"
    >
      <FaithTopicLinkList
        items={sections.map((s) => ({
          href: `/kid/faith/learn/basics/${s.id}`,
          title: s.title,
        }))}
      />
    </FaithPageFrame>
  );
}
