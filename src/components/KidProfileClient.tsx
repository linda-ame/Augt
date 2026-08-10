"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AVATAR_EMOJI_GROUPS,
  DEFAULT_AVATAR_EMOJI,
} from "@/lib/avatar-emojis";
import { ChildAvatar } from "@/components/ChildAvatar";

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
  const router = useRouter();
  const [emoji, setEmoji] = useState(initial.avatar_emoji);
  const [url, setUrl] = useState(initial.avatar_url);
  const [tab, setTab] = useState<"emoji" | "photo">("emoji");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function saveEmoji(next: string) {
    setLoading(true);
    setError(null);
    setMessage(null);
    const res = await fetch("/api/children/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar_emoji: next }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || "Neizdevās saglabāt.");
      return;
    }
    setEmoji(json.child.avatar_emoji);
    setMessage("Emoji saglabāts.");
    router.refresh();
  }

  async function onUpload(file: File | null) {
    if (!file) return;
    setLoading(true);
    setError(null);
    setMessage(null);
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
    setUrl(json.child.avatar_url);
    setMessage("Bilde saglabāta.");
    router.refresh();
  }

  async function removePhoto() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/children/me/avatar", { method: "DELETE" });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || "Neizdevās noņemt bildi.");
      return;
    }
    setUrl(null);
    setMessage("Bilde noņemta.");
    router.refresh();
  }

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
        <div className="flex items-center gap-4">
          <ChildAvatar
            avatar_emoji={emoji || DEFAULT_AVATAR_EMOJI}
            avatar_url={url}
            size="lg"
          />
          <div>
            <p className="font-semibold text-[var(--bg-deep)]">
              {initial.displayName}
            </p>
            <p className="text-sm text-[var(--ink-soft)]">Tava profila bilde</p>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            className={`btn text-sm ${tab === "emoji" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setTab("emoji")}
          >
            Emoji
          </button>
          <button
            type="button"
            className={`btn text-sm ${tab === "photo" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setTab("photo")}
          >
            Bilde
          </button>
        </div>

        {tab === "emoji" && (
          <div className="mt-5 space-y-5">
            {AVATAR_EMOJI_GROUPS.map((group) => (
              <div key={group.id}>
                <p className="text-sm font-semibold text-[var(--accent-deep)]">
                  {group.name}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {group.emojis.map((e) => (
                    <button
                      key={e}
                      type="button"
                      disabled={loading}
                      onClick={() => saveEmoji(e)}
                      className={`h-11 w-11 rounded-full text-xl border transition ${
                        emoji === e
                          ? "border-[var(--bg-deep)] bg-[var(--bg-soft)]"
                          : "border-[var(--line)] bg-white/80"
                      }`}
                      aria-label={`Izvēlēties ${e}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "photo" && (
          <div className="mt-5 space-y-3">
            <label className="btn btn-accent inline-flex cursor-pointer text-sm">
              Izvēlēties bildi
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={loading}
                onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
              />
            </label>
            <p className="text-sm text-[var(--ink-soft)]">
              JPEG, PNG vai WebP, līdz 2 MB.
            </p>
            {url && (
              <button
                type="button"
                className="btn btn-secondary text-sm"
                disabled={loading}
                onClick={removePhoto}
              >
                Noņemt bildi
              </button>
            )}
          </div>
        )}
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

      {message && (
        <p className="mt-4 text-sm text-[var(--ok)]">{message}</p>
      )}
      {error && (
        <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>
      )}
    </main>
  );
}
