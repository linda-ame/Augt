import { redirect } from "next/navigation";
import { resolveActiveChild } from "@/lib/active-child";
import { FaithPageFrame } from "@/components/faith/FaithPageFrame";
import { CurriculumMenu } from "@/components/faith/CurriculumMenu";
import { getCurriculumTopic } from "@/lib/faith-curriculum";

export default async function CurriculumTopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const active = await resolveActiveChild();
  if (!active) redirect("/");

  const { topic } = await params;
  if (topic === "prayers" || topic === "basics") {
    redirect(`/kid/faith/learn/${topic}`);
  }

  const entry = getCurriculumTopic(topic);
  if (!entry) redirect("/kid/faith/learn");

  return (
    <FaithPageFrame
      pageTitle={entry.title}
      backHref="/kid/faith/learn"
    >
      <CurriculumMenu
        book={entry.book}
        basePath={`/kid/faith/learn/${topic}`}
      />
    </FaithPageFrame>
  );
}
