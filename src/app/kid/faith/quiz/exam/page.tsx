import { redirect } from "next/navigation";
import { resolveActiveChild } from "@/lib/active-child";
import { FaithPageFrame } from "@/components/faith/FaithPageFrame";
import { ExamClient } from "@/components/faith/ExamClient";

export default async function FaithExamPage() {
  const active = await resolveActiveChild();
  if (!active) redirect("/");

  return (
    <FaithPageFrame
      pageTitle="Lielais eksāmens"
      backHref="/kid/faith/quiz"
      backLabel="← Visi testi"
    >
      <ExamClient />
    </FaithPageFrame>
  );
}
