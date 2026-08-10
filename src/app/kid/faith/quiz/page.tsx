import { redirect } from "next/navigation";
import { resolveActiveChild } from "@/lib/active-child";
import { FaithPageFrame } from "@/components/faith/FaithPageFrame";

const QUIZZES = [
  {
    href: "/kid/faith/quiz/flashcards",
    title: "Atceries un pārbaudi",
  },
  {
    href: "/kid/faith/quiz/exam",
    title: "Lielais eksāmens",
  },
];

export default async function FaithQuizHubPage() {
  const active = await resolveActiveChild();
  if (!active) redirect("/");

  return (
    <FaithPageFrame pageTitle="Testi">
      <div className="faith-grid">
        {QUIZZES.map((q) => (
          <a key={q.href} className="faith-card faith-card--repeat" href={q.href}>
            {q.title}
          </a>
        ))}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/faith/quiz.jpg" alt="" className="faith-hub-img" />
    </FaithPageFrame>
  );
}
