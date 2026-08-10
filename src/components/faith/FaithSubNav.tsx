"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/kid/faith", label: "Sākums", match: (p: string) => p === "/kid/faith" },
  {
    href: "/kid/faith/learn",
    label: "Mācīties",
    match: (p: string) => p.startsWith("/kid/faith/learn"),
  },
  {
    href: "/kid/faith/games",
    label: "Spēles",
    match: (p: string) => p.startsWith("/kid/faith/games"),
  },
  {
    href: "/kid/faith/quiz",
    label: "Testi",
    match: (p: string) => p.startsWith("/kid/faith/quiz"),
  },
] as const;

export function FaithSubNav() {
  const pathname = usePathname() || "";

  return (
    <nav className="faith-subnav" aria-label="Ticības sadaļas">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={link.match(pathname) ? "is-active" : undefined}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
