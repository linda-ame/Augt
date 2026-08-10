import { redirect } from "next/navigation";
import Image from "next/image";
import { resolveActiveChild } from "@/lib/active-child";
import { FaithPageFrame } from "@/components/faith/FaithPageFrame";

export default async function FaithHomePage() {
  const active = await resolveActiveChild();
  if (!active) redirect("/");

  return (
    <FaithPageFrame>
      <section className="faith-hero">
        <h1 className="faith-page-title">Atklāj ticības pasauli</h1>
        <p className="mt-2 text-center text-[var(--ink-soft)]">
          Mācies, spēlējies un pārbaudi sevi aizraujošā veidā.
        </p>
      </section>

      <Image
        src="/brand/augt-tree.png"
        alt=""
        width={420}
        height={430}
        className="faith-hub-logo mx-auto mt-6 block h-auto w-[min(70%,280px)] object-contain"
        priority
      />
    </FaithPageFrame>
  );
}
