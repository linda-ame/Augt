import { redirect } from "next/navigation";

/** Legacy routes → new curriculum paths or prayer book. */
export default async function LegacyPrayerSectionRedirect({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;

  if (section === "citas") redirect("/kid/prayers?cat=citas");
  if (section === "ikdienas") redirect("/kid/prayers?cat=pamata");
  if (section === "par-lugsanu") {
    redirect("/kid/faith/learn/prayers/par-lugsanu/kas-ir-lugsana");
  }
  if (section === "skaidrojumi") {
    redirect("/kid/faith/learn/prayers");
  }

  redirect("/kid/faith/learn/prayers");
}
