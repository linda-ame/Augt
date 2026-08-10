import { Suspense } from "react";
import { hasFamilyAccess } from "@/lib/family-access";
import LoginPage from "./LoginClient";

export default async function Page() {
  const unlocked = await hasFamilyAccess();
  return (
    <Suspense fallback={<main className="p-10">Ielādē…</main>}>
      <LoginPage initiallyUnlocked={unlocked} />
    </Suspense>
  );
}
