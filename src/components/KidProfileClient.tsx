"use client";

import { ChildAvatarEditor } from "@/components/ChildAvatarEditor";

type ChildProfile = {
  displayName: string;
  age: number;
  avatar_emoji: string | null;
  avatar_url: string | null;
  notifications_enabled: boolean;
};

export function KidProfileClient({
  initial,
  showLogout = false,
}: {
  initial: ChildProfile;
  showLogout?: boolean;
}) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[var(--ink-soft)]">
            {initial.displayName}, {initial.age} gadi
          </p>
        </div>
        {showLogout ? (
          <button
            type="button"
            className="btn btn-secondary shrink-0 text-sm"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/";
            }}
          >
            Iziet
          </button>
        ) : null}
      </header>

      <section className="panel mt-8 p-6">
        <h2 className="brand-mark text-2xl text-[var(--bg-deep)]">
          Profila attēls
        </h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Pievieno bildi vai izvēlies emoji — tāpat kā izvēlnē augšā.
        </p>
        <div className="mt-6">
          <ChildAvatarEditor
            displayName={initial.displayName}
            avatar_emoji={initial.avatar_emoji}
            avatar_url={initial.avatar_url}
            caption={initial.displayName}
          />
        </div>
      </section>

      <section className="panel mt-5 p-6">
        <h2 className="brand-mark text-2xl">Paziņojumi</h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">
          Katru rītu Augt var atsūtīt dienas tēmu un citātu uz šo ierīci.
        </p>
        <a href="/kid/settings" className="btn btn-primary mt-4 inline-flex text-sm">
          Paziņojumu iestatījumi
        </a>
      </section>

      <section className="panel mt-5 p-6">
        <h2 className="brand-mark text-2xl">Lūgšanas</h2>
        <p className="mt-2 text-[var(--ink-soft)]">
          Pamatlūgšanas un citas bieži lietotās lūgšanas vienā vietā.
        </p>
        <a href="/kid/prayers" className="btn btn-primary mt-4 inline-flex text-sm">
          Atvērt lūgšanas
        </a>
      </section>
    </main>
  );
}
