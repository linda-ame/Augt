import { redirect } from "next/navigation";
import { resolveActiveChild } from "@/lib/active-child";
import { FaithPageFrame } from "@/components/faith/FaithPageFrame";

const GAMES = [
  {
    slug: "bausli-savieno",
    title: "10 baušļi - savieno",
    kind: "theory" as const,
  },
  {
    slug: "bausli-skaidrojumi",
    title: "10 baušļi - skaidrojumi",
    kind: "theory" as const,
  },
  {
    slug: "kas-greko",
    title: "Kas grēko?",
    kind: "think" as const,
  },
  {
    slug: "kuru-bausli-parkapj",
    title: "Kuru bausli pārkāpj?",
    kind: "think" as const,
  },
  {
    slug: "vai-ir-greks",
    title: "Vai tas ir grēks?",
    kind: "think" as const,
  },
];

export default async function FaithGamesHubPage() {
  const active = await resolveActiveChild();
  if (!active) redirect("/");

  return (
    <FaithPageFrame pageTitle="Spēles">
      <div className="faith-grid">
        {GAMES.map((game) => (
          <a
            key={game.slug}
            className={`faith-card faith-card--${game.kind}`}
            href={`/kid/faith/games/${game.slug}`}
          >
            {game.title}
          </a>
        ))}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/faith/games.jpg" alt="" className="faith-hub-img" />
    </FaithPageFrame>
  );
}
