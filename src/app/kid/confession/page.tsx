import { redirect } from "next/navigation";
import { resolveActiveChild } from "@/lib/active-child";
import { ConfessionClient } from "@/components/confession/ConfessionClient";

export default async function KidConfessionPage() {
  const active = await resolveActiveChild();
  if (!active) redirect("/");

  const ageLabel =
    active.via === "guest"
      ? active.displayName
      : `${active.age} gadi`;

  return (
    <ConfessionClient
      ageLabel={ageLabel}
      canChangeAge={active.via === "guest"}
    />
  );
}
