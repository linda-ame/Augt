import { notFound, redirect } from "next/navigation";
import { resolveActiveChild } from "@/lib/active-child";
import { FaithPageFrame } from "@/components/faith/FaithPageFrame";
import { BausliSavienoGame } from "@/components/faith/BausliSavienoGame";
import { BausliSkaidrojumiGame } from "@/components/faith/BausliSkaidrojumiGame";
import { KasGrekoGame } from "@/components/faith/KasGrekoGame";
import { KuruBausliGame } from "@/components/faith/KuruBausliGame";
import { VaiIrGreksGame } from "@/components/faith/VaiIrGreksGame";

const GAMES = {
  "bausli-savieno": {
    title: "10 baušļi – savieno!",
    Component: BausliSavienoGame,
  },
  "bausli-skaidrojumi": {
    title: "Baušļi – skaidrojumi",
    Component: BausliSkaidrojumiGame,
  },
  "kas-greko": {
    title: "Kas grēko?",
    Component: KasGrekoGame,
  },
  "kuru-bausli-parkapj": {
    title: "Kuru bausli pārkāpj?",
    Component: KuruBausliGame,
  },
  "vai-ir-greks": {
    title: "Vai tas ir grēks?",
    Component: VaiIrGreksGame,
  },
} as const;

type Slug = keyof typeof GAMES;

export function generateStaticParams() {
  return Object.keys(GAMES).map((slug) => ({ slug }));
}

export default async function FaithGamePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const active = await resolveActiveChild();
  if (!active) redirect("/");

  const { slug } = await params;
  const game = GAMES[slug as Slug];
  if (!game) notFound();

  const { Component, title } = game;

  return (
    <FaithPageFrame
      pageTitle={title}
      backHref="/kid/faith/games"
      backLabel="← Visas spēles"
    >
      <Component />
    </FaithPageFrame>
  );
}
