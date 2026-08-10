"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AGE_BAND_THEMES } from "@/data/age-band-themes";
import { BrandLogo } from "@/components/BrandLogo";

const AGE_SUMMARIES = [
  {
    id: "age_7_9",
    label: "7–9 gadi",
    points: [
      "Īsāka Evaņģēlija pieredze, ja teksts ir ļoti garš vai grūts",
      "Vienkāršs skaidrojums un viena konkrēta pārdoma",
      "Viens praktisks uzdevums, ko var izmēģināt tajā pašā dienā",
      "Īsa rīta un vakara lūgšana; vakara atskats bez kaunināšanas",
    ],
  },
  {
    id: "age_10_12",
    label: "10–12 gadi",
    points: [
      "Parasti pilnais Evaņģēlija teksts",
      "Dziļāks skaidrojums: kas notiek, ko Jēzus māca, kāpēc tas svarīgi",
      "Pārdomu jautājums un praktisks uzdevums",
      "Pārējie dienas lasījumi — pēc izvēles",
    ],
  },
  {
    id: "age_13_15",
    label: "13–15 gadi",
    points: [
      "Pilnais Evaņģēlijs ar saikni ar pusaudža ikdienu",
      "Skaidrojums “par manu dzīvi” — skola, draugi, attiecības, digitālā vide",
      "Šodienas izaicinājums un dziļāka sirdsapziņas izmeklēšana",
      "Saturu veido cieņpilni, bez seksualizēšanas un bez kaunināšanas",
    ],
  },
  {
    id: "age_16_19",
    label: "16–19 gadi",
    points: [
      "Nobriedušāks skaidrojums un praktiski izaicinājumi",
      "Brīvība = spēja izvēlēties labo, nevis “ticēt vai neticēt” / “kam ticēt”",
      "Ticība tikai kristīgajam Trīsvienīgajam Dievam, kā māca Katoļu Baznīca",
      "Sensitīvas tēmas tikai tad, ja tās dabiski izriet no dienas lasījuma",
    ],
  },
] as const;

type BandId = (typeof AGE_SUMMARIES)[number]["id"];

export default function ParAugtPage() {
  const [bandId, setBandId] = useState<BandId>("age_7_9");

  const group = useMemo(
    () => AGE_SUMMARIES.find((g) => g.id === bandId)!,
    [bandId],
  );
  const themes = useMemo(
    () => AGE_BAND_THEMES.find((t) => t.id === bandId),
    [bandId],
  );

  return (
    <main className="relative mx-auto min-h-screen max-w-2xl px-6 py-10 sm:px-10">
      <header className="flex items-center justify-between gap-4">
        <BrandLogo href="/" size="sm" />
        <Link href="/" className="btn btn-secondary text-sm">
          Atpakaļ
        </Link>
      </header>

      <article className="mt-12 space-y-12 pb-16">
        <section>
          <h1 className="brand-mark text-4xl text-[var(--bg-deep)] sm:text-5xl">
            Kā Augt veido saturu
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-[var(--ink-soft)]">
            Augt ir katoļu ikdienas palīgs ģimenēm. Zemāk — īsi, ko vecāki var
            zināt par lasījumiem, AI un vecuma grupām.
          </p>
        </section>

        <section>
          <h2 className="brand-mark text-2xl text-[var(--bg-deep)]">
            No kurienes nāk teksti?
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-[var(--ink)] leading-relaxed">
            <li>
              <strong>Liturģiskie lasījumi</strong> (Evaņģēlijs, 1. lasījums,
              2. lasījums, psalms, Alleluja) nāk no{" "}
              <a
                href="https://mieramtuvu.lv"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-[var(--accent)] underline-offset-2"
              >
                Mieram tuvu
              </a>
              .
            </li>
            <li>
              <strong>Skaidrojumi, lūgšanas, jautājumi un uzdevumi</strong>{" "}
              <strong>nav garīdznieku, teologu vai Baznīcas oficiāli apstiprināts
              mācību teksts</strong>. Tos{" "}
              <strong>ģenerē mākslīgais intelekts (AI)</strong>, ievērojot autoru
              sagatavotās satura specifikācijas — atsevišķi katrai vecuma grupai
              (7–9, 10–12, 13–15, 16–19). Specifikācijas palīdz AI palikt katoļu
              mācības robežās, taču{" "}
              <strong>ģenerētais saturs nepretendē uz teoloģisku autoritāti</strong>.
              Katrs to izmanto pēc sava ieskata un uz savu atbildību; neskaidrībās
              ieteicams jautāt priesterim, katehētam vai citam uzticamam cilvēkam
              Baznīcā.
            </li>
            <li>
              Specifikācija nosaka, <em>ko</em> AI drīkst un nedrīkst darīt:
              garumu, toni, dienas struktūru, katoļu mācības robežas un to, kā
              Evaņģēliju sasaistīt ar bērna vai jaunieša ikdienu.
            </li>
            <li>
              AI <strong>nesāk no “jauniešu tēmas”</strong> un nepielāgo pantu —
              sākums vienmēr ir šodienas Evaņģēlijs un liturģija. Zemāk redzamās
              tēmas / īpašības AI var izmantot{" "}
              <strong>tikai tad, ja tās dabiski izriet no lasījuma</strong>.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="brand-mark text-2xl text-[var(--bg-deep)]">
            Autoru norādītie pamatprincipi AI
          </h2>
          <p className="mt-3 text-[var(--ink-soft)] leading-relaxed">
            Šie nav “vispārīgi padomi”, bet{" "}
            <strong>noteikumi, ko autori ir ielikuši AI specifikācijā</strong> —
            kam AI jāseko, ģenerējot skaidrojumus, lūgšanas un uzdevumus. Tie ir
            balstīti Romas katoļu Baznīcas mācībā.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-[var(--ink)] leading-relaxed">
            <li>
              Saturam jābūt saskaņā ar <strong>Romas katoļu Baznīcas mācību</strong>.
            </li>
            <li>
              Ticība ir <strong>kristīgajam Trīsvienīgajam Dievam</strong> — Tēvam,
              Dēlam un Svētajam Garam. Citas reliģijas netiek pasniegtas kā
              līdzvērtīga “ticības izvēle”.
            </li>
            <li>
              Mērķis ir palīdzēt iepazīt Kristu, saprast Dieva Vārdu, veidot
              sirdsapziņu un augt tikumos — ne relativizēt ticību.
            </li>
            <li>
              Tonis: silts un cieņpilns; bez kaunināšanas, biedēšanas un
              moralizēšanas.
            </li>
            <li>
              Sensitīvas tēmas (attiecības, digitālā vide u.c.) parādās tikai tad,
              ja tās dabiski izriet no dienas lasījuma.
            </li>
            <li>
              Vecuma grupa maina valodu un dziļumu; tā{" "}
              <strong>nemaina</strong> katoļu mācības pamatus.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="brand-mark text-2xl text-[var(--bg-deep)]">
            Vecuma grupas
          </h2>
          <p className="mt-3 text-[var(--ink-soft)] leading-relaxed">
            Izvēlies vecuma grupu, lai redzētu, pēc kādas autoru specifikācijas
            AI ģenerē ikdienas saturu šai grupai — dienas forma un iespējamās
            tēmas / īpašības. Zemāk ir{" "}
            <strong>kopsavilkums vecākiem</strong>, nevis pilnā tehniskā
            specifikācija, ko saņem AI.
          </p>

          <label className="mt-6 block max-w-md">
            <span className="mb-2 block text-sm font-medium uppercase tracking-[0.12em] text-[var(--accent-deep)]">
              Vecuma grupa
            </span>
            <div className="relative">
              <select
                className="field w-full appearance-none border-[var(--bg-deep)] py-3 pl-4 pr-10 text-lg font-bold text-[var(--bg-deep)]"
                value={bandId}
                onChange={(e) => setBandId(e.target.value as BandId)}
                aria-label="Izvēlētā vecuma grupa"
              >
                {AGE_SUMMARIES.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
              <span
                aria-hidden
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--accent-deep)]"
              >
                ▾
              </span>
            </div>
          </label>

          <div className="mt-8">
            <p className="text-sm font-medium uppercase tracking-[0.12em] text-[var(--accent-deep)]">
              Dienas forma
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[var(--ink)] leading-relaxed">
              {group.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>

            {themes && (
              <>
                <p className="mt-6 text-sm font-medium uppercase tracking-[0.12em] text-[var(--accent-deep)]">
                  Tēmas un īpašības specifikācijā
                </p>
                {themes.note && (
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
                    {themes.note}
                  </p>
                )}
                <div className="mt-4 space-y-4">
                  {themes.categories.map((cat) => (
                    <div key={cat.title}>
                      <p className="font-semibold text-[var(--bg-deep)]">
                        {cat.title}
                      </p>
                      <p className="mt-1 text-[var(--ink-soft)] leading-relaxed">
                        {cat.items.join(" · ")}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        <section>
          <h2 className="brand-mark text-2xl text-[var(--bg-deep)]">
            Ko Augt nedara
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-[var(--ink)] leading-relaxed">
            <li>Neaicina apšaubīt katoļu ticību “dziļuma” dēļ.</li>
            <li>
              Nepasniegt kristīgo morāli tikai kā aizliegumu sarakstu bez
              “kāpēc”.
            </li>
            <li>
              Neaizstāj priesteri, vecākus vai grēksūdzi — tas ir ikdienas
              palīgs, ne visa Baznīcas dzīve.
            </li>
          </ul>
        </section>

        <p className="pt-4">
          <Link href="/" className="btn btn-primary">
            Uz sākumu
          </Link>
        </p>
      </article>
    </main>
  );
}
