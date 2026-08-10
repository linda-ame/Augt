import { redirect } from "next/navigation";
import { resolveActiveChild } from "@/lib/active-child";
import { FaithPageFrame } from "@/components/faith/FaithPageFrame";

const TOPICS = [
  { href: "/kid/faith/learn/prayers", label: "Lūgšanas" },
  { href: "/kid/faith/learn/basics", label: "Ticības pamati" },
  { href: "/kid/faith/learn/god", label: "Dievs un ticība" },
  { href: "/kid/faith/learn/commandments", label: "Baušļi" },
  { href: "/kid/faith/learn/sacraments", label: "Sakramenti" },
];

export default async function FaithLearnHubPage() {
  const active = await resolveActiveChild();
  if (!active) redirect("/");

  return (
    <FaithPageFrame
      pageTitle="Īss katoļu katehisms"
    >
      <div className="faith-grid">
        {TOPICS.map((t) => (
          <a key={t.href} className="faith-card" href={t.href}>
            {t.label}
          </a>
        ))}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/faith/learn.jpg" alt="" className="faith-hub-img" />
    </FaithPageFrame>
  );
}
