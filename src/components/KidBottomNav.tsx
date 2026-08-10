"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

function IconToday({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4.6" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5 5l1.55 1.55M17.45 17.45 19 19M19 5l-1.55 1.55M6.55 17.45 5 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconPrayers({ className }: { className?: string }) {
  return (
    <span
      className={className}
      aria-hidden
      style={{
        backgroundColor: "currentColor",
        WebkitMaskImage: "url(/icons/pray-hands.png)",
        maskImage: "url(/icons/pray-hands.png)",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}

function IconFaith({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M5.2 3.8h10.4c1.2 0 2.2 1 2.2 2.2v12.8c0 .5-.4.9-.9.9H6.6c-.8 0-1.4-.6-1.4-1.4V3.8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M8.2 3.8v15.3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M14.2 8v6.4M11.7 10.4h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconConfession({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      {/* Same vertical span as Bible (~3.8–20) so both sit on one line */}
      <path
        d="M12 20.2
           C12 20.2 4.2 14.8 4.2 9.6
           C4.2 6.7 6.4 4.5 9.1 4.5
           C10.6 4.5 11.6 5.2 12 6.2
           C12.4 5.2 13.4 4.5 14.9 4.5
           C17.6 4.5 19.8 6.7 19.8 9.6
           C19.8 14.8 12 20.2 12 20.2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 9.6v5M9.5 12.1h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const ITEMS: {
  href: string;
  label: string;
  match: (path: string) => boolean;
  icon: (props: { className?: string }) => ReactNode;
  iconClass?: string;
}[] = [
  {
    href: "/kid",
    label: "Šodien",
    match: (path) => path === "/kid",
    icon: IconToday,
  },
  {
    href: "/kid/prayers",
    label: "Lūgšanas",
    match: (path) => path.startsWith("/kid/prayers"),
    icon: IconPrayers,
  },
  {
    href: "/kid/faith",
    label: "Mana ticība",
    match: (path) => path.startsWith("/kid/faith"),
    icon: IconFaith,
    iconClass: "block h-9 w-9 shrink-0",
  },
  {
    href: "/kid/confession",
    label: "Grēksūdze",
    match: (path) => path.startsWith("/kid/confession"),
    icon: IconConfession,
    iconClass: "block h-9 w-9 shrink-0",
  },
];

export function KidBottomNav() {
  const pathname = usePathname() || "/kid";

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--bg-cream)]/95 backdrop-blur-md"
      style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }}
      aria-label="Galvenā navigācija"
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-between gap-1 px-2 pt-1">
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-label={item.label}
                title={item.label}
                aria-current={active ? "page" : undefined}
                className="flex h-[3.85rem] flex-col items-center justify-center gap-0.5 rounded-2xl px-1 transition"
                style={
                  active
                    ? {
                        background:
                          "linear-gradient(180deg, #2a5a4e 0%, var(--bg-deep) 100%)",
                        color: "var(--bg-cream)",
                        boxShadow: "inset 0 0 0 1px rgba(196, 163, 90, 0.35)",
                      }
                    : { color: "var(--ink-soft)" }
                }
              >
                <span className="flex h-7 w-7 items-center justify-center sm:h-8 sm:w-8">
                  <Icon
                    className={
                      item.iconClass
                        ? "block h-7 w-7 shrink-0 sm:h-8 sm:w-8"
                        : "block h-6 w-6 shrink-0 sm:h-7 sm:w-7"
                    }
                  />
                </span>
                <span
                  className={`max-w-full truncate px-0.5 text-[0.65rem] font-semibold leading-none tracking-wide ${
                    active ? "text-[var(--bg-cream)]" : "text-[var(--ink-soft)]"
                  }`}
                >
                  {item.label === "Mana ticība" ? "Ticība" : item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
