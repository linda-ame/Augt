"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ChildAvatar } from "@/components/ChildAvatar";
import { ChildAvatarEditor } from "@/components/ChildAvatarEditor";
import { ParentGateDialog } from "@/components/ParentGateDialog";

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6.5 9.5a5.5 5.5 0 0 1 11 0c0 3.2.8 4.4 1.5 5.5H5c.7-1.1 1.5-2.3 1.5-5.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M10 18.5a2 2 0 0 0 4 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 4v1.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function QuoteMenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8.5 17.5c-2.2 0-3.8-1.7-3.8-3.9 0-2.4 1.8-4.5 4.5-6.1l.7 1.2c-1.7 1-2.7 2.2-2.7 3.6 0 .9.5 1.6 1.4 1.6 1.1 0 1.9-.9 1.9-2.1V8.5H5.8V6.2h7.3v5.5c0 3.2-1.9 5.8-4.6 5.8Zm9.2 0c-2.2 0-3.8-1.7-3.8-3.9 0-2.4 1.8-4.5 4.5-6.1l.7 1.2c-1.7 1-2.7 2.2-2.7 3.6 0 .9.5 1.6 1.4 1.6 1.1 0 1.9-.9 1.9-2.1V8.5h-4.7V6.2H22v5.5c0 3.2-1.9 5.8-4.3 5.8Z"
        fill="currentColor"
      />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15.5H7.5A2.5 2.5 0 0 0 5 21V5.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M5 18.5h12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 12h9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M15.5 8.5 19 12l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 5.5H7.5A2.5 2.5 0 0 0 5 8v8a2.5 2.5 0 0 0 2.5 2.5H13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="9" r="3.25" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5.5 19.2c.9-3.1 3.2-4.7 6.5-4.7s5.6 1.6 6.5 4.7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 6.5 8.5 12 14 17.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 12h9.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function KidProfileMenu({
  displayName,
  avatar_emoji,
  avatar_url,
  showLogout = true,
  showBackToParent = false,
}: {
  displayName: string;
  avatar_emoji: string | null;
  avatar_url: string | null;
  showLogout?: boolean;
  showBackToParent?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Element | null;
      if (target?.closest?.("[data-augt-emoji-dialog]")) return;
      if (target?.closest?.("[data-augt-parent-gate]")) return;
      if (target?.closest?.("[data-augt-save-quote]")) return;
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        // Emoji / gate dialogs handle their own Escape first.
        if (document.querySelector("[data-augt-emoji-dialog]")) return;
        if (document.querySelector("[data-augt-parent-gate]")) return;
        setOpen(false);
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function unlockParent(pin: string) {
    setUnlockBusy(true);
    setUnlockError(null);
    try {
      const res = await fetch("/api/parent/view-child", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId: null, pin }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Nepareizs kods.");
      }
      window.location.assign("/parent");
    } catch (err) {
      setUnlockError(err instanceof Error ? err.message : "Kļūda");
      setUnlockBusy(false);
    }
  }

  async function forgotGatePin() {
    setUnlockBusy(true);
    setUnlockError(null);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login?mode=parent";
    } catch {
      setUnlockBusy(false);
      setUnlockError("Neizdevās iziet. Mēģini vēlreiz.");
    }
  }
  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Profila izvēlne"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        title="Profils"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--bg-deep)]"
      >
        <ChildAvatar
          avatar_emoji={avatar_emoji}
          avatar_url={avatar_url}
          size="sm"
        />
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-[var(--bg-deep)]/25 backdrop-blur-[1px]"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            id={menuId}
            role="menu"
            className="absolute right-0 top-[calc(100%+0.6rem)] z-50 w-72 origin-top-right rounded-2xl border border-[var(--line)] bg-[var(--bg-cream)] p-2.5 shadow-2xl"
          >
            <div className="flex flex-col items-center gap-1 px-2 pb-3 pt-3">
              <ChildAvatarEditor
                displayName={displayName}
                avatar_emoji={avatar_emoji}
                avatar_url={avatar_url}
                caption={displayName}
                compact
              />
            </div>

            <div className="mt-1 flex flex-col gap-0.5 border-t border-[var(--line)] pt-1.5">
              {showBackToParent ? (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-[var(--bg-deep)] outline-none hover:bg-[var(--bg-soft)]"
                  onClick={() => {
                    setOpen(false);
                    setUnlockError(null);
                    setUnlockOpen(true);
                  }}
                >
                  <BackIcon className="h-5 w-5 shrink-0" />
                  <span>Atpakaļ uz vecāku profilu</span>
                </button>
              ) : null}
              <Link
                href="/kid/settings"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[var(--bg-deep)] outline-none hover:bg-[var(--bg-soft)]"
              >
                <BellIcon className="h-5 w-5 shrink-0" />
                <span>Paziņojumi</span>
              </Link>
              <Link
                href="/kid/prayers"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[var(--bg-deep)] outline-none hover:bg-[var(--bg-soft)]"
              >
                <BookIcon className="h-5 w-5 shrink-0" />
                <span>Lūgšanas</span>
              </Link>
              {!showBackToParent ? (
                <Link
                  href="/kid/quotes"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[var(--bg-deep)] outline-none hover:bg-[var(--bg-soft)]"
                >
                  <QuoteMenuIcon className="h-5 w-5 shrink-0" />
                  <span>Mani citāti</span>
                </Link>
              ) : null}
              <Link
                href="/kid/profile"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[var(--bg-deep)] outline-none hover:bg-[var(--bg-soft)]"
              >
                <ProfileIcon className="h-5 w-5 shrink-0" />
                <span>Profils</span>
              </Link>
              {showLogout ? (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-[var(--bg-deep)] outline-none hover:bg-[var(--bg-soft)]"
                  onClick={async () => {
                    setOpen(false);
                    await fetch("/api/auth/logout", { method: "POST" });
                    window.location.href = "/";
                  }}
                >
                  <LogoutIcon className="h-5 w-5 shrink-0" />
                  <span>Iziet</span>
                </button>
              ) : null}
            </div>
          </div>
        </>
      ) : null}

      <ParentGateDialog
        open={unlockOpen}
        mode="unlock"
        busy={unlockBusy}
        error={unlockError}
        onClose={() => {
          if (unlockBusy) return;
          setUnlockOpen(false);
          setUnlockError(null);
        }}
        onSubmit={unlockParent}
        onForgot={forgotGatePin}
      />
    </div>
  );
}
