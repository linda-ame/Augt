/** Curated avatar emoji allowlist — warm, gentle, faith-friendly. No monsters/violence/occult. */

export type AvatarEmojiGroup = {
  id: string;
  name: string;
  emojis: string[];
};

export const AVATAR_EMOJI_GROUPS: AvatarEmojiGroup[] = [
  {
    id: "nature",
    name: "Daba",
    emojis: [
      "🌱",
      "🌿",
      "🍀",
      "🌳",
      "🌸",
      "🌺",
      "🌻",
      "🌼",
      "🌷",
      "🌾",
      "🍃",
      "🪴",
    ],
  },
  {
    id: "sky",
    name: "Debesis",
    emojis: ["☀️", "🌤️", "🌈", "⭐", "🌟", "✨", "🌙", "☁️", "🕊️"],
  },
  {
    id: "animals",
    name: "Dzīvnieki",
    emojis: ["🐑", "🐟", "🐦", "🐤", "🐰", "🐻", "🐼", "🦊", "🐨", "🦋", "🐝"],
  },
  {
    id: "joy",
    name: "Prieks",
    emojis: ["😊", "🥰", "😇", "🙂", "😄", "🤗", "💛", "💖", "🤍", "🎈"],
  },
  {
    id: "faith",
    name: "Ticība",
    emojis: ["✝️", "🙏", "📖", "⛪", "🕯️", "🔔", "🩵"],
  },
];

export const ALLOWED_AVATAR_EMOJIS: string[] = AVATAR_EMOJI_GROUPS.flatMap(
  (g) => g.emojis,
);

export const DEFAULT_AVATAR_EMOJI = "🌱";

export function isAllowedAvatarEmoji(emoji: string): boolean {
  return ALLOWED_AVATAR_EMOJIS.includes(emoji);
}

export function resolveChildAvatar(input: {
  avatar_url?: string | null;
  avatar_emoji?: string | null;
}): { kind: "image"; url: string } | { kind: "emoji"; emoji: string } {
  if (input.avatar_url) return { kind: "image", url: input.avatar_url };
  const emoji =
    input.avatar_emoji && isAllowedAvatarEmoji(input.avatar_emoji)
      ? input.avatar_emoji
      : DEFAULT_AVATAR_EMOJI;
  return { kind: "emoji", emoji };
}
