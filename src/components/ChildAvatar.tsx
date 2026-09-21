"use client";

import { resolveChildAvatar } from "@/lib/avatar-emojis";

const SIZE = {
  sm: { box: "h-9 w-9", emoji: "text-[1.35rem] scale-[1.35]" },
  md: { box: "h-11 w-11", emoji: "text-[1.65rem] scale-[1.35]" },
  /** Dropdown / compact editor */
  lg: { box: "h-16 w-16", emoji: "text-[2.6rem] scale-[1.4]" },
  /** Profile page editor */
  xl: { box: "h-24 w-24", emoji: "text-[3.75rem] scale-[1.35]" },
} as const;

export function ChildAvatar({
  avatar_emoji,
  avatar_url,
  size = "md",
  className = "",
}: {
  avatar_emoji?: string | null;
  avatar_url?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const avatar = resolveChildAvatar({ avatar_emoji, avatar_url });
  const { box, emoji } = SIZE[size];

  if (avatar.kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatar.url}
        alt=""
        className={`${box} rounded-full object-cover border border-[var(--line)] bg-white ${className}`}
      />
    );
  }

  return (
    <span
      className={`${box} inline-flex items-center justify-center overflow-hidden rounded-full bg-[var(--bg-soft)] border border-[var(--line)] leading-none ${className}`}
      aria-hidden
    >
      <span className={`inline-block translate-y-[0.06em] ${emoji}`}>
        {avatar.emoji}
      </span>
    </span>
  );
}
