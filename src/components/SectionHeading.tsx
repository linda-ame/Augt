import Image from "next/image";
import type { ReactNode } from "react";

const ICON_CLASS =
  "h-9 w-9 shrink-0 text-[var(--accent-deep)] sm:h-10 sm:w-10";
const SW = 1.7;

function Svg({
  children,
  className = ICON_CLASS,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** Open Bible PNG (gold, no background) — Evaņģēlijs */
export function IconBook({ className }: { className?: string }) {
  return (
    <Image
      src="/icons/gospel-bible.png"
      alt=""
      width={80}
      height={74}
      unoptimized
      className={`object-contain ${className ?? ICON_CLASS}`}
      aria-hidden
    />
  );
}

/** Lightbulb PNG (gold, no background) — Ko tas nozīmē? */
export function IconMeaning({ className }: { className?: string }) {
  return (
    <Image
      src="/icons/meaning-bulb.png"
      alt=""
      width={80}
      height={80}
      unoptimized
      className={`object-contain ${className ?? ICON_CLASS}`}
      aria-hidden
    />
  );
}

/** Star — Šodienas izaicinājums */
export function IconChallenge({ className }: { className?: string }) {
  return (
    <Svg className={className ?? ICON_CLASS}>
      <path
        d="m12 2.8 2.45 5.1 5.6.8-4.05 3.95 1 5.55L12 15.6 6.999 18.2l1-5.55L3.95 8.7l5.6-.8L12 2.8Z"
        stroke="currentColor"
        strokeWidth={SW}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Thought bubble — Pārdomas */
export function IconReflect({ className }: { className?: string }) {
  return (
    <Svg className={className ?? ICON_CLASS}>
      <path
        d="M7.2 14.8c-2-.8-3.4-2.7-3.4-4.9C3.8 6.7 6.6 4 10.1 4c2.8 0 5.1 1.7 5.9 4.1.4-.2.9-.3 1.4-.3 2.3 0 4.1 1.8 4.1 4 0 2-1.5 3.7-3.5 4"
        stroke="currentColor"
        strokeWidth={SW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7.6" cy="19.4" r="1.25" fill="currentColor" />
      <circle cx="10.5" cy="17" r="0.9" fill="currentColor" />
      <path
        d="M9.2 9.2h4.2M9.2 11.6h2.8"
        stroke="currentColor"
        strokeWidth={SW}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Praying hands PNG (gold) — Lūgšana */
export function IconPray({ className }: { className?: string }) {
  return (
    <Image
      src="/icons/pray-hands-gold.png"
      alt=""
      width={80}
      height={80}
      unoptimized
      className={`object-contain ${className ?? ICON_CLASS}`}
      aria-hidden
    />
  );
}

/** Sun — Rīta lūgšana */
export function IconMorning({ className }: { className?: string }) {
  return (
    <Svg className={className ?? ICON_CLASS}>
      <circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth={SW} />
      <path
        d="M12 2.6v2.4M12 19v2.4M2.6 12h2.4M19 12h2.4M5.2 5.2l1.7 1.7M17.1 17.1l1.7 1.7M18.8 5.2l-1.7 1.7M6.9 17.1l-1.7 1.7"
        stroke="currentColor"
        strokeWidth={SW}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Moon + stars PNG (gold) — Vakara lūgšana */
export function IconEvening({ className }: { className?: string }) {
  return (
    <Image
      src="/icons/evening-night.png"
      alt=""
      width={80}
      height={80}
      unoptimized
      className={`object-contain ${className ?? ICON_CLASS}`}
      aria-hidden
    />
  );
}

/** Eye — Apskats */
export function IconOverview({ className }: { className?: string }) {
  return (
    <Svg className={className ?? ICON_CLASS}>
      <path
        d="M2.4 12s3.5-5.6 9.6-5.6S21.6 12 21.6 12s-3.5 5.6-9.6 5.6S2.4 12 2.4 12Z"
        stroke="currentColor"
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth={SW} />
    </Svg>
  );
}

/** Music note — Psalms */
export function IconPsalm({ className }: { className?: string }) {
  return (
    <Svg className={className ?? ICON_CLASS}>
      <path
        d="M9.6 18.8a2.8 2.8 0 1 1-2.7-2.8"
        stroke="currentColor"
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M9.6 16V4.6l9-1.5V13.6"
        stroke="currentColor"
        strokeWidth={SW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.6 15.8a2.8 2.8 0 1 1-2.7-2.8"
        stroke="currentColor"
        strokeWidth={SW}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Spark — Alleluja */
export function IconAlleluia({ className }: { className?: string }) {
  return (
    <Svg className={className ?? ICON_CLASS}>
      <path
        d="M12 2.6v4.4M12 17v4.4M4.2 6.6l3.1 3.1M16.7 14.3l3.1 3.1M2.6 12h4.4M17 12h4.4M4.2 17.4l3.1-3.1M16.7 9.7l3.1-3.1"
        stroke="currentColor"
        strokeWidth={SW}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export type SectionIconId =
  | "book"
  | "meaning"
  | "challenge"
  | "reflect"
  | "pray"
  | "morning"
  | "evening"
  | "overview"
  | "psalm"
  | "alleluia";

const ICONS: Record<
  SectionIconId,
  (p: { className?: string }) => ReactNode
> = {
  book: IconBook,
  meaning: IconMeaning,
  challenge: IconChallenge,
  reflect: IconReflect,
  pray: IconPray,
  morning: IconMorning,
  evening: IconEvening,
  overview: IconOverview,
  psalm: IconPsalm,
  alleluia: IconAlleluia,
};

export function SectionHeading({
  icon,
  children,
  as: Tag = "h2",
  className = "brand-mark section-title text-2xl",
}: {
  icon: SectionIconId;
  children: ReactNode;
  as?: "h2" | "h3";
  className?: string;
}) {
  const Icon = ICONS[icon];
  return (
    <Tag className={className}>
      <Icon />
      {children}
    </Tag>
  );
}
