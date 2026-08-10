"use client";

import { resolveChildAvatar } from "@/lib/avatar-emojis";

export function ChildAvatar({
  avatar_emoji,
  avatar_url,
  size = "md",
}: {
  avatar_emoji?: string | null;
  avatar_url?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const avatar = resolveChildAvatar({ avatar_emoji, avatar_url });
  const sizeClass =
    size === "lg"
      ? "h-20 w-20 text-4xl"
      : size === "sm"
        ? "h-9 w-9 text-lg"
        : "h-11 w-11 text-xl";

  if (avatar.kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatar.url}
        alt=""
        className={`${sizeClass} rounded-full object-cover border border-[var(--line)] bg-white`}
      />
    );
  }

  return (
    <span
      className={`${sizeClass} inline-flex items-center justify-center rounded-full bg-[var(--bg-soft)] border border-[var(--line)]`}
      aria-hidden
    >
      {avatar.emoji}
    </span>
  );
}
