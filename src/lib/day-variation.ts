import { formatInTimeZone } from "date-fns-tz";
import { parseISO } from "date-fns";
import { isSchoolDayContext, RIGA_TZ } from "@/lib/dates";

function dayOfYear(dateStr: string): number {
  return Number(
    formatInTimeZone(parseISO(dateStr), RIGA_TZ, "D", {
      useAdditionalDayOfYearTokens: true,
    }),
  );
}

function pick<T>(items: readonly T[], index: number): T {
  return items[((index % items.length) + items.length) % items.length]!;
}

const SCHOOL_INTERCESSION = [
  "ģimene — viens konkrēts cilvēks mājās, ko šodien redzēsi, ne “visa ģimene” vispārīgi",
  "draugi — viens draugs, ne “visi draugi”",
  "skola — viens skolotājs vai klasesbiedrs, ja tas dabiski izriet no dienas; ne “visa skola”",
  "cilvēki, kurus šodien satiksi — viens satikums, ne saraksts",
  "kāds, kam šodien grūti — bez minēšanas, kas vainīgs",
] as const;

const HOME_INTERCESSION = [
  "ģimene — viens konkrēts cilvēks mājās, ne “visa ģimene”",
  "draugi — viens draugs",
  "kāds, ko šodien satiksi ārpus skolas",
  "kāds, kam šodien grūti",
  "cilvēki, ar kuriem būsi pie galda vai mājās — viens no viņiem",
  "kāds, kuru sen neesi redzējis, vai kurš ir slims",
] as const;

const MORNING_VOICE = [
  "Pirmais teikums ir KONKRĒTS tēls no šodienas Evaņģēlija (vieta, priekšmets, žests vai vārds, ko Jēzus saka). Tas NAV “Paldies par nakti” un NAV “Paldies par jauno dienu”. Pateicība par nakti nāk vēlāk, vienā īsā teikumā.",
  "Atver ar to, kur cilvēks ir šobrīd (mostas, gaisma, klusums). Tad viena pateicība. Tad Evaņģēlija tēls. Ne “Kungs, šodien es nāku pie Tevis” kā standarta sākums.",
  "Atver ar īsu jautājumu Dievam, kas izriet no šodienas Evaņģēlija ainas, un tūlīt ar lūgumu. Pateicība — vienā teikumā, ne kā ievads.",
  "Atver ar upurēšanu: šodienas pirmais konkrētais brīdis (ēdiens, ceļš, saruna). “Domas, vārdi un darbi” drīkst būt, bet piekarini tiem šodienas ainu, ne tukšu formulu.",
  "Atver, nosaucot Jēzu ar to, ko Viņš ŠODIENAS tekstā dara — ne “mīlošais Jēzus” vispārīgi.",
  "Atver ar vienu godīgu vajadzību, kas izriet no Evaņģēlija (ne “palīdzi būt labam”). Tad pateicība. Tad aizlūgums.",
] as const;

const EVENING_LEAD = [
  "closing sākas ar naktsmieru. Sargāšanu, ģimeni, veselību un sargāšanu no ļauna ievij īsākos teikumos pēc tam. Vismaz viens teikums nes šodienas Evaņģēlija tēlu naktī.",
  "closing sākas ar ģimeni — nosauc mājās, ne “manu ģimeni” kā etiķeti. Tad miers, veselība, sargāšana. Evaņģēlija tēls — vienā teikumā.",
  "closing sākas ar veselību (sev un tiem, kurus mīli). Miegu un sargāšanu savij citos teikumos.",
  "closing sākas ar sargāšanu no ļauna un nelaimēm — bez baiļu valodas, īsi. Tad miers un ģimene. Garākais teikums ir Evaņģēlija tēls, ne aizsardzības saraksts.",
  "closing sākas ar “paliec ar mani šonakt” un šodienas Evaņģēlija vārdu vai žestu. Pārējos elementus ieliec divos teikumos, ne kā piecu punktu sarakstu.",
  "Visi pieci elementi ir, bet teikumu kārtība un darbības vārdi ir citi (ne “sargā, dod, pasargā” trīs reizes pēc kārtas). Viens elements ir palīgteikums, ne atsevišķs teikums.",
] as const;

const ACTION_SHAPES = [
  "Viens konkrēts teikums, ko šodien pateikt — kam un aptuveni ko. Saistīts ar darbības vārdu no Evaņģēlija, ne ar “esi laipns”.",
  "Viena neredzama palīdzība mājās vienam cilvēkam. Nosauc brīdi. Saikne ar to, ko Jēzus šajā ainā dara.",
  "Viena reize apstāties pirms ierastas reakcijas (vārds, ko nepasaki, vai ko pasaki savādāk). Ne “visu dienu”.",
  "20–30 sekunžu kluss lūgums konkrētā brīdī (pirms ēdiena, izejot, kad uznāk dusmas). Lūguma saturs no šodienas ainas.",
  "Pateikties vienam cilvēkam par vienu konkrētu lietu. Ne vispārīga pateicība Dievam — tā jau ir lūgšanās.",
  "Noklausīties vienu stāstu līdz galam, neiejaucoties. Saikne ar to, kā Evaņģēlijā kāds klausās vai netiek sadzirdēts.",
  "Atteikties no viena maza komforta (ekrāns vienā reizē, pēdējais kumoss, pirmais vārds) un to upurēt. Ne maratons.",
  "Pamanīt vienu labo īpašību cilvēkā, ar kuru nav viegli, un to parādīt vienā mazā solī, ne runā.",
  "Viens godīgs “piedod” vai — ja nav kam atvainoties — viens godīgs “paldies”, ko parasti nepasaki. Izvēlies vienu.",
  "Viens mājas darbs, ko neviens nelūdza. Saikni ar kalpošanu lieto TIKAI ja šodienas teksts to nes; citādi saiti meklē tekstā.",
  "Viens teikums lūgšanā par cilvēku, kuru šodien redzēsi, tieši pirms satikšanas.",
  "Klusums vienā brīdī, kur parasti komentētu. Nosauc brīdi.",
  "Padalīties ar kaut ko mazu (laiks, vieta, lieta) ar vienu cilvēku. Ne “dalies ar visiem”.",
  "Dienas vidū (ēdot vai ejot) atcerēties vienu Evaņģēlija teikumu un uzreiz pēc tam vienu mazu rīcību.",
] as const;

const LINK_STYLES = [
  "Atkārto vienu konkrētu vārdu vai tēlu, kas ir GAN šajā lasījumā, GAN Evaņģēlijā. Nesaic “arī šeit māca mīlestību”.",
  "Pretstats: lasījums sola vai brīdina par kaut ko konkrētu, Evaņģēlijs parāda, kā Jēzus to dara. Nosauc to no teksta.",
  "Tas pats Dieva darbs (žēlo, aicina, sūta, dziedina, baro) — nosauc darbību abos tekstos, ne tikumu.",
  "Ko šis lasījums sagatavo un ko Evaņģēlijs piepilda. Viena konkrēta sagatavošana, ne “viss ved uz Jēzu”.",
  "Ko cilvēks šajā lasījumā dara vai no kā atsakās, un kā Evaņģēlijs to pašu aicina citā ainā. Divas ainas, ne morāle.",
] as const;

/** Today's assigned angles. Required prayer elements stay; the shape must change. */
export function dayVariationBrief(dateStr: string): string {
  const n = dayOfYear(dateStr);
  const school = isSchoolDayContext(dateStr);
  const intercession = pick(school ? SCHOOL_INTERCESSION : HOME_INTERCESSION, n);
  const voice = pick(MORNING_VOICE, n + 2);
  const evening = pick(EVENING_LEAD, n + 4);
  const action = pick(ACTION_SHAPES, n + 1);
  const link = pick(LINK_STYLES, n + 3);

  return `ŠODIENAS VARIĀCIJA (obligāti šai dienai; struktūra un obligātie elementi paliek, bet FORMA mainās):
- Rīta balss: ${voice}
- Rīta aizlūgums par citiem — TIKAI šis virziens: ${intercession}.
- Vakara closing: VISI pieci elementi joprojām ir tekstā (sargā mani; sargā ģimeni; naktsmiers; veselība; sargā no ļauna, nelaimēm un slimībām) un beidzas ar Āmen. Mainās kārtība un ritms: ${evening}
- Vakara jautājumi: saglabā vecuma grupas tēmu SKAITU un secību, bet NEDRĪKST iekopēt vadlīniju teikumus vārds vārdā. Katru jautājumu pārfrāzē. Vismaz viens jautājums piemin šodienas Evaņģēlija konkrētu ainu (personu, vārdu, žestu), ne tikumu “pacietība / mīlestība / labestība”.
- gospel.real_life_application — šī forma: ${action} Ja forma neder šodienas Evaņģēlijam, izvēlies tuvāko mazo rīcību, kas IZRIET no teksta, bet NEDRĪKST krist atpakaļ uz “šodien esi laipns / pacietīgs / palīdzi kādam”.
- parts.*.connection_to_gospel — šis saiknes veids katram lasījumam, ar citu konkrētu detaļu no TĀ lasījuma: ${link}
- gospel.prayer: cita uzruna un cits Evaņģēlija tēls nekā rīta lūgšanā. Ne “Jēzu, palīdzi man būt labākam”.`;
}

function clip(value: string | undefined, max = 160): string {
  if (!value) return "";
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

type RecentLesson = {
  reading_date?: string;
  content_json?: unknown;
};

/** Short excerpts so the model does not reuse yesterday's sentences. */
export function recentVariationAvoidance(rows: RecentLesson[]): string {
  const lines: string[] = [];
  for (const row of rows.slice(0, 5)) {
    const content = row.content_json as
      | {
          morning_prayer?: { opening?: string };
          evening_prayer?: { closing?: string };
          gospel?: { real_life_application?: string; prayer?: string };
          parts?: { first_reading?: { connection_to_gospel?: string } };
        }
      | null
      | undefined;
    if (!content) continue;
    const bits = [
      clip(content.morning_prayer?.opening),
      clip(content.gospel?.real_life_application),
      clip(content.evening_prayer?.closing),
      clip(content.gospel?.prayer),
      clip(content.parts?.first_reading?.connection_to_gospel),
    ].filter(Boolean);
    if (!bits.length) continue;
    lines.push(`- ${row.reading_date ?? "iepriekš"}: ${bits.join(" | ")}`);
  }
  if (!lines.length) return "";
  return `NESENĀS DIENAS (NEDRĪKST atkārtot šos sākumus, šīs ainas, šo rīcības veidu, šos vakara teikumus):
${lines.join("\n")}`;
}
