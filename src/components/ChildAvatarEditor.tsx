"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { ChildAvatar } from "@/components/ChildAvatar";
import { EmojiPickerDialog } from "@/components/EmojiPickerDialog";

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8.5 7.5 9.8 5.8A1.5 1.5 0 0 1 11 5.2h2a1.5 1.5 0 0 1 1.2.6l1.3 1.7H17a2.5 2.5 0 0 1 2.5 2.5v7a2.5 2.5 0 0 1-2.5 2.5H7A2.5 2.5 0 0 1 4.5 17v-7A2.5 2.5 0 0 1 7 7.5h1.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function SmileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
      <path
        d="M8.5 13.5s1.4 2 3.5 2 3.5-2 3.5-2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="9.2" cy="10" r="1" fill="currentColor" />
      <circle cx="14.8" cy="10" r="1" fill="currentColor" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 7l10 10M17 7 7 17"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ChildAvatarEditor({
  displayName,
  avatar_emoji: avatarEmojiProp,
  avatar_url: avatarUrlProp,
  caption,
  compact = false,
}: {
  displayName: string;
  avatar_emoji: string | null;
  avatar_url: string | null;
  caption?: string;
  /** Smaller avatar circle for dropdown menus */
  compact?: boolean;
}) {
  const router = useRouter();
  const inputId = useId();
  const [avatarUrl, setAvatarUrl] = useState(avatarUrlProp);
  const [avatarEmoji, setAvatarEmoji] = useState(avatarEmojiProp);
  const [syncKey, setSyncKey] = useState(
    `${avatarUrlProp ?? ""}|${avatarEmojiProp ?? ""}`,
  );
  const nextSyncKey = `${avatarUrlProp ?? ""}|${avatarEmojiProp ?? ""}`;
  if (syncKey !== nextSyncKey) {
    setSyncKey(nextSyncKey);
    setAvatarUrl(avatarUrlProp);
    setAvatarEmoji(avatarEmojiProp);
  }

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const hasAvatar = Boolean(avatarUrl || avatarEmoji);

  async function onUpload(file: File | null) {
    if (!file) return;
    setError(null);
    setLoading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/children/me/avatar", {
      method: "POST",
      body: form,
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || "Augšupielāde neizdevās.");
      return;
    }
    setAvatarUrl(json.child.avatar_url);
    setAvatarEmoji(json.child.avatar_emoji ?? null);
    router.refresh();
  }

  async function removeAvatar() {
    setError(null);
    setLoading(true);
    if (avatarUrl) {
      const res = await fetch("/api/children/me/avatar", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setLoading(false);
        setError(json.error || "Neizdevās noņemt bildi.");
        return;
      }
    }
    if (avatarEmoji) {
      const res = await fetch("/api/children/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_emoji: null }),
      });
      const json = await res.json();
      if (!res.ok) {
        setLoading(false);
        setError(json.error || "Neizdevās noņemt emoji.");
        return;
      }
    }
    setLoading(false);
    setAvatarUrl(null);
    setAvatarEmoji(null);
    router.refresh();
  }

  async function saveEmoji(emoji: string) {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/children/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar_emoji: emoji }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || "Neizdevās saglabāt emoji.");
      return;
    }
    setAvatarEmoji(json.child.avatar_emoji);
    setAvatarUrl(json.child.avatar_url ?? null);
    setEmojiOpen(false);
    router.refresh();
  }

  const badge = compact
    ? "absolute flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow-sm transition disabled:opacity-60"
    : "absolute flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-sm transition disabled:opacity-60";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${loading ? "opacity-60" : ""}`}>
        <label
          htmlFor={inputId}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="relative block cursor-pointer rounded-full p-1 outline-offset-2 focus-within:outline focus-within:outline-2 focus-within:outline-[var(--bg-deep)]"
        >
          <ChildAvatar
            avatar_emoji={avatarEmoji}
            avatar_url={avatarUrl}
            size={compact ? "lg" : "xl"}
          />
          <span
            className={`${badge} pointer-events-none bottom-0 right-0 bg-[var(--accent)] text-[var(--bg-deep)]`}
            aria-hidden
          >
            <CameraIcon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
          </span>
          <span className="sr-only">
            {hasAvatar ? "Mainīt profila bildi" : "Pievienot profila bildi"}
          </span>
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={loading}
          onChange={(e) => {
            void onUpload(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
        {hasAvatar ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void removeAvatar();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            disabled={loading}
            aria-label={avatarEmoji ? "Noņemt emoji" : "Noņemt bildi"}
            className={`${badge} bottom-0 left-0 bg-white text-[var(--danger)] hover:bg-[var(--bg-soft)]`}
          >
            <XIcon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
          </button>
        ) : null}
      </div>

      {caption ? (
        <p className="text-center text-base font-semibold leading-tight text-[var(--bg-deep)]">
          {caption}
        </p>
      ) : (
        <p className="text-center text-sm text-[var(--ink-soft)]">{displayName}</p>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setError(null);
          setEmojiOpen(true);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        disabled={loading}
        className="btn btn-secondary inline-flex min-h-10 items-center gap-1.5 !px-4 text-sm"
      >
        <SmileIcon className="h-4 w-4" />
        {avatarEmoji ? "Mainīt emoji" : "Lietot emoji"}
      </button>

      {loading && !hasAvatar ? (
        <p className="text-xs text-[var(--ink-soft)]">Augšupielādē…</p>
      ) : null}
      {error ? (
        <p className="max-w-[16rem] text-center text-xs font-medium text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      <EmojiPickerDialog
        open={emojiOpen}
        currentEmoji={avatarEmoji}
        busy={loading}
        onClose={() => {
          if (!loading) setEmojiOpen(false);
        }}
        onPick={saveEmoji}
      />
    </div>
  );
}
