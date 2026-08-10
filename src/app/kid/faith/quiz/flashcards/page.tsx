import { redirect } from "next/navigation";
import { resolveActiveChild } from "@/lib/active-child";
import { FaithPageFrame } from "@/components/faith/FaithPageFrame";
import { FlashcardsClient } from "@/components/faith/FlashcardsClient";

export default async function FaithFlashcardsPage() {
  const active = await resolveActiveChild();
  if (!active) redirect("/");

  return (
    <FaithPageFrame
      pageTitle="Atceries un pārbaudi"
      backHref="/kid/faith/quiz"
      backLabel="← Visi testi"
    >
      <FlashcardsClient />
    </FaithPageFrame>
  );
}
