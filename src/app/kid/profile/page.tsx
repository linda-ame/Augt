import { redirect } from "next/navigation";
import { resolveActiveChild } from "@/lib/active-child";
import { KidProfileClient } from "@/components/KidProfileClient";

export default async function KidProfilePage() {
  const active = await resolveActiveChild();
  if (!active) redirect("/");

  return (
    <KidProfileClient
      initial={{
        displayName: active.displayName,
        age: active.age,
        avatar_emoji: active.avatar_emoji,
        avatar_url: active.avatar_url,
        notifications_enabled: active.notifications_enabled,
      }}
      showLogout={active.via !== "guest"}
    />
  );
}
