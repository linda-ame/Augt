import Link from "next/link";
import { resolveActiveChild } from "@/lib/active-child";
import { ChildAvatar } from "@/components/ChildAvatar";
import { KidTopBarTitle } from "@/components/KidTopBarTitle";

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
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

export async function KidTopBar() {
  const active = await resolveActiveChild();
  const isGuest = !active || active.via === "guest";
  const isParent = active?.via === "parent";

  return (
    <header
      className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg-cream)]/95 backdrop-blur-md"
      style={{ paddingTop: "max(0.35rem, env(safe-area-inset-top))" }}
    >
      <div className="mx-auto flex h-16 max-w-2xl items-center justify-between gap-3 overflow-visible px-6">
        <div className="min-w-0 overflow-visible">
          <KidTopBarTitle />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/kid/settings"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--bg-deep)] outline-offset-2 hover:bg-[var(--bg-deep)]/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--bg-deep)]"
            aria-label="Paziņojumi"
            title="Paziņojumi"
          >
            <BellIcon className="h-5 w-5" />
          </Link>
          {isGuest || !active ? (
            <Link
              href="/login"
              className="btn btn-secondary !px-3 !py-1.5 text-sm"
            >
              Pieslēgties
            </Link>
          ) : (
            <>
              {isParent ? (
                <Link
                  href="/parent"
                  className="btn btn-secondary !px-3 !py-1.5 text-sm"
                >
                  Atpakaļ
                </Link>
              ) : null}
              <Link
                href="/kid/profile"
                className="rounded-full outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--bg-deep)]"
                aria-label="Profils"
                title="Profils"
              >
                <ChildAvatar
                  avatar_emoji={active.avatar_emoji}
                  avatar_url={active.avatar_url}
                  size="sm"
                />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
