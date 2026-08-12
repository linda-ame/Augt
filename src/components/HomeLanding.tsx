"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AGE_BANDS,
  AGE_BAND_STORAGE_KEY,
  type AgeBandId,
} from "@/lib/age-bands";
import { BrandLogo } from "@/components/BrandLogo";

export function HomeLanding({
  initialBand,
  forcePicker,
  appVersion,
}: {
  initialBand: AgeBandId | null;
  forcePicker: boolean;
  /** Short deploy git SHA (e.g. c403d90), or "dev" locally */
  appVersion?: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState<AgeBandId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const showContinue = Boolean(initialBand) && !forcePicker;

  async function chooseBand(band: AgeBandId) {
    setSaving(band);
    setError(null);
    try {
      localStorage.setItem(AGE_BAND_STORAGE_KEY, band);
      const res = await fetch("/api/guest/age-band", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ band }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Neizdevās saglabāt.");
      router.push("/kid");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kļūda");
      setSaving(null);
    }
  }

  return (
    <main className="relative overflow-x-hidden">
      {/* Background photo — first viewport; bottom fades into page on both sides */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[100dvh]">
        <Image
          src="/brand/hero-grow.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[78%_58%]"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(100deg,rgba(247,250,248,0.94)_0%,rgba(247,250,248,0.88)_36%,rgba(247,250,248,0.4)_58%,rgba(247,250,248,0.08)_78%,rgba(247,250,248,0.02)_100%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(247,250,248,0.2)_0%,transparent_40%,rgba(247,250,248,0.55)_72%,rgba(247,250,248,0.92)_88%,#f7faf8_100%)]"
          aria-hidden
        />
      </div>
      <div
        className="pointer-events-none absolute -left-24 top-10 z-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,#c4a35a44,transparent_70%)]"
        aria-hidden
      />

      {/* First screen: brand + age + auth — bottom padding clears the overlapping photo below */}
      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col items-center justify-start px-5 pt-10 pb-36 sm:px-10 sm:pt-14 sm:pb-48">
        <section
          className="section-enter w-full"
          style={{ animationDelay: "60ms" }}
        >
          <h1 className="mx-auto flex w-fit max-w-full flex-row items-center justify-center gap-5 sm:gap-8 md:gap-10">
            <BrandLogo as="span" size="lg" priority />
            <span className="brand-mark min-w-0 shrink text-left text-[clamp(1.75rem,5.5vw,3.35rem)] leading-[1.15] text-[var(--bg-deep)]">
              <span className="block">Dieva Vārds.</span>
              <span className="block">Ticība.</span>
              <span className="block">Dzīve.</span>
              <span className="block">Katru dienu.</span>
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-center text-[0.95rem] leading-snug text-[var(--ink-soft)] sm:mt-5 sm:text-base sm:leading-relaxed">
            Ikdienas palīgs katoļu ģimenēm, lai palīdzētu bērniem un jauniešiem
            augt ticībā — ar dienas lasījumiem, skaidrojumu, pārdomām, lūgšanām
            un uzdevumiem. Izvēlies vecuma grupu un sāc.
          </p>
        </section>

        <section
          className="section-enter mt-5 w-full max-w-lg sm:mt-7"
          style={{ animationDelay: "120ms" }}
          aria-label="Vecuma grupa"
        >
          {showContinue && initialBand && (
            <div className="mb-4 text-center">
              <button
                type="button"
                className="btn btn-primary w-full sm:w-auto"
                onClick={() => chooseBand(initialBand)}
                disabled={saving !== null}
              >
                Turpināt · {AGE_BANDS.find((b) => b.id === initialBand)?.label}
              </button>
              <p className="mt-3 text-sm text-[var(--ink-soft)]">
                Vai izvēlies citu vecuma grupu:
              </p>
            </div>
          )}

          {!showContinue && (
            <p className="mb-3 text-center text-sm font-medium uppercase tracking-[0.14em] text-[var(--accent-deep)]">
              Vecuma grupa
            </p>
          )}

          <ul className="flex flex-wrap justify-center gap-2">
            {AGE_BANDS.map((band) => {
              const active = initialBand === band.id;
              return (
                <li key={band.id}>
                  <button
                    type="button"
                    disabled={saving !== null}
                    onClick={() => chooseBand(band.id)}
                    className={`rounded-xl border px-3.5 py-2 text-sm font-medium transition ${
                      active
                        ? "border-[var(--bg-deep)] bg-[var(--bg-deep)] text-white"
                        : "border-[var(--line)] bg-white/70 text-[var(--ink)] hover:border-[var(--bg-mid)]"
                    }`}
                  >
                    {saving === band.id ? "Atver…" : band.label}
                  </button>
                </li>
              );
            })}
          </ul>

          {error && (
            <p className="mt-3 text-center text-sm text-[var(--danger)]" role="alert">
              {error}
            </p>
          )}
        </section>

        <div
          className="section-enter relative z-20 mt-6 flex w-full max-w-lg flex-wrap items-center justify-center gap-3 sm:mt-8"
          style={{ animationDelay: "180ms" }}
        >
          <Link href="/login?mode=parent-register" className="btn btn-primary">
            Reģistrēties
          </Link>
          <Link href="/login" className="btn btn-secondary">
            Pieslēgties
          </Link>
        </div>
      </div>

      {/* Hands/seedling photo — not the page background */}
      <div className="relative z-10 mx-auto -mt-28 max-w-3xl px-5 pb-10 sm:-mt-40 sm:px-10">
        <div className="relative mx-auto aspect-[16/9] w-full max-w-lg overflow-hidden rounded-[1.5rem]">
          <Image
            src="/brand/home-nurture.png"
            alt="Rokas tur augsni ar mazu asnu — rūpes un izaugsme"
            fill
            sizes="(max-width: 768px) 100vw, 512px"
            className="object-cover"
          />
        </div>

        <p className="mx-auto mt-8 max-w-lg text-center text-sm leading-relaxed text-[var(--ink-soft)]">
          Liturģiskie lasījumi no{" "}
          <a
            href="https://mieramtuvu.lv"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-[var(--accent)] underline-offset-2"
          >
            Mieram tuvu
          </a>
          . Skaidrojumi, lūgšanas un uzdevumi{" "}
          <strong>tiek ģenerēti ar AI</strong> pēc autoru specifikācijām — tie
          nav garīdznieku vai teologu apstiprināts mācību teksts un nepretendē
          uz teoloģisku autoritāti; katrs izmanto pēc ieskata un uz savu
          atbildību.
        </p>
        <p className="mt-5 text-center">
          <Link
            href="/par"
            className="btn btn-secondary text-sm font-semibold tracking-[0.04em]"
          >
            VECĀKIEM — kā Augt veido saturu
          </Link>
        </p>
        {appVersion ? (
          <p
            className="mt-10 pb-2 text-center font-mono text-[0.65rem] tracking-[0.08em] text-[var(--ink-soft)]/45"
            title="Deploy versija"
          >
            {appVersion}
          </p>
        ) : null}
      </div>
    </main>
  );
}
