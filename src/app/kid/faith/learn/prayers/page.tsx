import { redirect } from "next/navigation";
import { resolveActiveChild } from "@/lib/active-child";
import { FaithPageFrame } from "@/components/faith/FaithPageFrame";
import { CurriculumMenu } from "@/components/faith/CurriculumMenu";
import { getPrayersCurriculumBook } from "@/lib/prayer-book";

export default async function PrayersHubPage() {
  const active = await resolveActiveChild();
  if (!active) redirect("/");

  const book = getPrayersCurriculumBook();

  return (
    <FaithPageFrame
      pageTitle="Lūgšanas"
      backHref="/kid/faith/learn"
    >
      <CurriculumMenu
        book={book}
        basePath="/kid/faith/learn/prayers"
      />

      <p className="mt-6 text-center text-sm text-[var(--ink-soft)]">
        Gribi skaitīt lūgšanu tekstus?{" "}
        <a
          className="font-semibold text-[var(--bg-deep)] underline"
          href="/kid/prayers"
        >
          Atvērt lūgšanu grāmatu →
        </a>
      </p>
    </FaithPageFrame>
  );
}
