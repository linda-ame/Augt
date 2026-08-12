import { readFileSync } from "fs";
import path from "path";
import { ageBandGenerationGuide } from "@/services/ai/age-band-guide";
import {
  AGE_BANDS,
  ageBandFromAge,
  type AgeBandId,
} from "@/lib/age-bands";
import { schoolDayContextForPrompt, todayInRiga } from "@/lib/dates";
import {
  dailyLessonContentSchema,
  type DailyLessonContent,
  type ScriptureReading,
} from "@/lib/types";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/** Best → … → lite (free-tier text models, Aug 2026).
 * Skip Pro on free (quota limit 0). Skip retired 2.0/2.5 (404 for new keys).
 * Aliases (flash-latest) omitted — they share underlying quotas.
 */
const DEFAULT_GEMINI_MODEL_CHAIN = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
] as const;

function aiConfig() {
  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new Error("Trūkst AI_BASE_URL vai AI_API_KEY.");
  }
  return { baseUrl: baseUrl.replace(/\/$/, ""), apiKey };
}

function isGeminiBaseUrl(baseUrl: string) {
  return baseUrl.includes("generativelanguage.googleapis.com");
}

/** Prefer AI_MODELS; else AI_MODEL first + Gemini fallbacks; else defaults. */
export function resolveModelChain(): string[] {
  const listed = process.env.AI_MODELS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (listed && listed.length > 0) return listed;

  const primary = process.env.AI_MODEL?.trim();
  const { baseUrl } = aiConfig();
  if (!isGeminiBaseUrl(baseUrl)) {
    return [primary || "gpt-4o-mini"];
  }

  const defaults = [...DEFAULT_GEMINI_MODEL_CHAIN];
  if (!primary) return defaults;
  return [primary, ...defaults.filter((m) => m !== primary)];
}

function isQuotaOrUnavailableError(status: number, body: string) {
  if (status === 404) return true;
  if (status !== 429) return false;
  return /quota|rate.?limit|free_tier|exceeded|resource.?exhausted/i.test(body);
}

export function loadCatholicPrinciples(): string {
  const file = path.join(process.cwd(), "ai", "catholic-principles.md");
  return readFileSync(file, "utf8");
}

const AGE_BAND_FILES: Record<AgeBandId, string> = {
  age_7_9: "7-9.md",
  age_10_12: "10-12.md",
  age_13_15: "13-15.md",
  age_16_19: "16-19.md",
};

export function loadAgeBandSpec(bandId: AgeBandId): string {
  const file = path.join(
    process.cwd(),
    "ai",
    "age-bands",
    AGE_BAND_FILES[bandId],
  );
  return readFileSync(file, "utf8");
}

export function loadSystemRules(): string {
  const file = path.join(process.cwd(), "ai", "system-rules.md");
  return readFileSync(file, "utf8");
}

export function loadGameLibrary() {
  const file = path.join(process.cwd(), "ai", "game-library.json");
  return JSON.parse(readFileSync(file, "utf8")) as {
    games: Array<{
      id: string;
      name: string;
      best_for: string[];
      age_range: [number, number];
      notes?: string;
      mode?: string;
    }>;
  };
}


async function chatCompletionWithModel(
  messages: ChatMessage[],
  model: string,
): Promise<string> {
  const { baseUrl, apiKey } = aiConfig();
  const isGemini = isGeminiBaseUrl(baseUrl);
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: 0.7,
  };
  if (!isGemini) {
    body.response_format = { type: "json_object" };
  }

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("AI neatgrieza saturu.");
      return content;
    }

    const errBody = await res.text();
    lastError = new Error(`AI kļūda ${res.status}: ${errBody.slice(0, 400)}`);

    // Daily/free-tier quota or missing model → caller should try next model.
    if (isQuotaOrUnavailableError(res.status, errBody)) {
      throw lastError;
    }

    // Brief RPM backoff, then give up on this model.
    if (res.status === 429 && attempt === 0) {
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }
    throw lastError;
  }
  throw lastError || new Error("AI kļūda");
}

/** Tries models in order (best → … → lite) until one succeeds. */
async function chatCompletion(
  messages: ChatMessage[],
): Promise<{ content: string; model: string }> {
  const models = resolveModelChain();
  let lastError: Error | null = null;

  for (let i = 0; i < models.length; i++) {
    const model = models[i]!;
    try {
      const content = await chatCompletionWithModel(messages, model);
      if (i > 0) {
        console.warn(`[ai] Izmanto fallback modeli: ${model}`);
      }
      return { content, model };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const msg = lastError.message;
      const canFallback =
        i < models.length - 1 &&
        (/AI kļūda (429|404)/.test(msg) ||
          isQuotaOrUnavailableError(0, msg));
      if (canFallback) {
        console.warn(
          `[ai] Modelis ${model} nederēja (${msg.slice(0, 120)}…). Mēģinu nākamo.`,
        );
        continue;
      }
      throw lastError;
    }
  }

  throw lastError || new Error("AI kļūda: visi modeļi neizdevās.");
}

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("AI atbilde nav derīgs JSON.");
  }
}

export async function generateChildProfile(input: {
  age: number;
  notes: {
    emphasize: string;
    challenges: string;
    boundaries: string;
    other: string;
  };
}): Promise<string> {
  const system = `${loadSystemRules()}

Uzdevums: izveido KOMPAKTU bērna personalizācijas profilu (latviešu valodā), ko izmantos ikdienas satura ģenerēšanai.
Profils ir iekšējs (bērns to neredz). Raksti pozitīvi: tikumi, pieeja, ikdienas situācijas — NEKAD kā "problēmas", diagnozes vai defektus.
Respektē "boundaries": tās tēmas NEiekļauj un NEizvērš.
Ja piezīmes ir tukšas vai ļoti skopas, izveido īsu, neitrālu vecumam atbilstošu profilu bez izdomātām grūtībām.
Apkopo galvenās tēmas 1–3 īsos rindkopās (ne sarakstu ar checkboxiem).
Atbildi JSON: { "profile": "..." }`;

  const user = JSON.stringify(
    {
      age: input.age,
      parent_notes: {
        emphasize: input.notes.emphasize || null,
        challenges: input.notes.challenges || null,
        boundaries: input.notes.boundaries || null,
        other: input.notes.other || null,
      },
    },
    null,
    2,
  );

  const { content: raw } = await chatCompletion([
    { role: "system", content: system },
    { role: "user", content: user },
  ]);
  const parsed = extractJson(raw) as { profile?: string };
  if (!parsed.profile || typeof parsed.profile !== "string") {
    throw new Error("Profila ģenerēšana neizdevās.");
  }
  return parsed.profile.trim();
}

export async function generateDailyLesson(input: {
  age: number;
  profile: string;
  scriptureText: string;
  readings?: ScriptureReading[];
  recentGameTypes: string[];
  /** Calendar day for school/weekend/summer context (yyyy-MM-dd, Europe/Riga). */
  date?: string;
  /** When set: public standard content for that age band (no child personalization). */
  ageBandId?: AgeBandId;
}): Promise<{ content: DailyLessonContent; provider: string; model: string }> {
  const models = resolveModelChain();
  const date = input.date ?? todayInRiga();
  const dayContext = schoolDayContextForPrompt(date);
  const games = loadGameLibrary().games.filter(
    (g) => input.age >= g.age_range[0] && input.age <= g.age_range[1],
  );

  const readingsPayload =
    input.readings && input.readings.length > 0
      ? input.readings.map((r) => ({
          role: r.role,
          label: r.label,
          reference: r.reference,
          text: r.text,
        }))
      : null;

  // Public guest path passes ageBandId; personalized children get band from exact age.
  const isPublicBand = Boolean(input.ageBandId);
  const bandId = input.ageBandId ?? ageBandFromAge(input.age);
  const bandMeta = AGE_BANDS.find((b) => b.id === bandId);
  const bandSpec = loadAgeBandSpec(bandId);
  const bandGuide = ageBandGenerationGuide(bandId);
  const principles = loadCatholicPrinciples();

  const systemPrefix = `${principles}

---

${loadSystemRules()}

---

VECUMA GRUPAS SPECIFIKĀCIJA (${bandMeta?.label ?? bandId}):
${bandSpec}

---

${bandGuide}

---`;

  const examenSchemaHint = `"examen_questions": string[]  // skaits un tēmas — skat. VECUMA GRUPAS vadlīnijas (3–6 jautājumi)`;

  const lengthRules = isPublicBand
    ? `- PUBLISKAIS STANDARTA saturs: BEZ bērna profila. PRIORITĀTE: vecuma grupas specifikācija + vadlīnijas (garumi, tonis, examen).
- gospel.explanation: DIVI LĪMEŅI iekšēji — (A) ko ŠIS fragments konkrēti māca; (B) kā aicina tuvoties Dievam / ļaut sevi pārveidot (ja tekstā — arī rūpe par tuvāko ceļu ar Dievu). Tad ikdienas augļi. Output = **plūstošs teksts BEZ** etiķetēm „Līmenis A/B”, „A:”, „B:”. Nē: tikai “esi labs” / konfliktu menedžments; nē: uzspiest “atgriešanos” katrai dienai.
- system-rules JSON struktūra (rīts/evaņģēlijs/spēle/vakars/parts) PALIEK, bet GARUMI un examen_questions SEKO vecuma grupai, ne “vienam izmēram visiem”.
- JA system-rules saka “tieši 3 examen_questions” vai fiksētus ~60–90 vārdus — šajā režīmā UZVAR vecuma grupas vadlīnijas.
- Saturs ŠAI grupai nedrīkst būt gandrīz identisks citai vecuma grupai (cits dziļums, citi piemēri, cits garums).`
    : `- PERSONALIZĒTS saturs: bāze = VECUMA GRUPAS specifikācija + vadlīnijas (garumi, tonis, examen, tēmas).
- Apstiprinātais profils ir NEREDZAMS papildslānis — izmanto TIKAI ja dabiski saskan ar šodienas Evaņģēliju; NEpiespied tēmas no profila.
- gospel.explanation + gospel.main_idea = DIVI LĪMEŅI iekšēji: (A) šī fragmenta konkrētā mācība; (B) ceļš ar Dievu / tuvināšanās Viņam. Tad tikumi kā augļi. Output BEZ „Līmenis A/B” etiķetēm — viens plūstošs teksts. NEDRĪKST tikai “esi labs” / konfliktu menedžments; NEDRĪKST vienu etiķeti visām dienām; NEDRĪKST profila lekcija.
- Ja profila tēma nesaskan ar tekstu — explanation paliek pie Evaņģēlija; profilu ignorē šajā sadaļā.
- Viegla personalizācija (ja dabiska) — galvenokārt real_life_application / spēles piemērā, ne “Ko tas nozīmē?” kodolā.
- system-rules JSON struktūra PALIEK; GARUMI un examen_questions SEKO vecuma grupai (ne “vienam izmēram visiem”).
- JA system-rules saka “tieši 3 examen_questions” vai fiksētus ~60–90 vārdus — UZVAR vecuma grupas vadlīnijas.
- Vecuma grupas “attīstāmās īpašības / tēmas” — tikai ja dabiski no Evaņģēlija (kā specifikācijā).`;

  const system = `${systemPrefix}

${dayContext}

Izveido šodienas pieredzi JSON shēmā:
{
  "day_overview": string,
  "morning_prayer": {
    "opening": string,
    "body": string,  // pateicība + Evaņģēlija saikne + īss aizlūgums par citiem (1 virziens)
    "offering": string,
    "closing": string
  },
  "evening_prayer": {
    "thanksgiving": string,
    "mercy": string,
    "examen_intro": string,
    ${examenSchemaHint},
    "resolution": string,  // īss lūgums pēc spēka, ne rītdienas plāns
    "closing": string  // ĪSTA vakara lūgšana: sargā mani+ģimeni, naktsmiers, veselība, no ļauna/nelaimēm/slimībām + Āmen
  },
  "gospel": {
    "title": string,
    "scripture_reference": string,
    "explanation": string,
    "main_idea": string,
    "real_life_application": string,
    "activity": { ...spēle... },
    "reflection_question": string,
    "prayer": string
  },
  "parts": {
    "first_reading"?: { "summary": string, "connection_to_gospel": string },
    "psalm"?: { "summary": string, "connection_to_gospel": string },
    "second_reading"?: { "summary": string, "connection_to_gospel": string },
    "alleluia"?: { "summary": string, "connection_to_gospel": string }
  }
}

Noteikumi:
- day_overview: 1–2 teikumi par VISU dienu (kā lasījumi saskan), rādīsies pirms tabiem.
- gospel.scripture_reference: TIKAI par Evaņģēliju (atsauce + īss teikums). NEIEJAUC 1. lasījumu / Pāvilu utt.
- gospel.explanation: iekšēji A (ko ŠIS teksts māca) + B (ceļš ar Dievu: tuvoties Viņam, ļaut sevi pārveidot; Dievam katrs svarīgs; rūpe par citiem — ja tekstā). Tad ikdienas auglis. **NEDRĪKST** tekstā rakstīt „Līmenis A”, „Līmenis B”, „A:”, „B:” — viens plūstošs skaidrojums. NESĀC ar gatavu tēmu. NEpārvērst par konfliktu menedžmentu vai profila lekciju. Neuzspiest atgriešanos/dvēseli, ja tekstā nav. Vienkāršo valodu, ne dziļumu.
- gospel.main_idea: 1 teikums = A + B saturs — ne tikuma sauklis, ne tīrs “risināsim strīdus”; ne no profila; bez „Līmenis A/B” vārdiem.
- Spēle un Evaņģēlija lūgšana TIKAI gospel objektā. gospel.prayer / rīts / vakars: saglabā ticības domu no Evaņģēlija, ne tikai “palīdzi būt labam”.
- gospel.activity: EVAŅĢĒLIJA teksts (ne vispārīga ikdiena). Ietver "type", "instruction"; explanation katrā jautājumā vai activity līmenī.
- multiple_choice / true_false: questions masīvs ar **tieši 2** īsiem punktiem par šodienas Evaņģēliju (katram: question, options, correct_answer indekss, explanation). UI rāda abus vienā panelī. true_false options: Patiess / Nepatiess.
- fill_blank: blanks masīvs ar **2–3** teikumiem (___), katram answer + explanation. UI pārbauda visus kopā.
- word_scramble: tieši 1 īss Evaņģēlija vārds (scrambled + answer + explanation).
- who_am_i: 1 persona; clues[2–3] progresīvi mājieni + answer + explanation.
- put_in_order: 3–4 notikumi no šodienas Evaņģēlija (items + correct_answer secība + explanation).
- matching: tieši 3 pāri no šodienas Evaņģēlija (pairs + explanation).
- find_the_mistake: 1 pārstāsts + „Kur ir kļūda?” + 3–4 variantu detaļas; correct_answer = kļūdas indekss.
- Quiz spēlēm: "correct_answer" vai "answer"; explanation NEUTRĀLS (bez „Lieliski!” / „Pareizi!”).
- scenario_choice / choose_the_best_response: ŠAURI — tikai ja tekstā ir skaidra rīcība/runa; ko Jēzus/nosaukts tēls no ŠĪ teksta darītu/teiktu šajā ainā. Bez skolas/ikdienas “ko tu darītu”. Ja šaubies — cits spēles tips. options (2–3), correct_answer, silts explanation.
- gospel.real_life_application: **mazs, izpildāms** ierosinājums šodienai (īsa izvēle / dažas minūtes). Nedrīkst: “rīt pirmo pusstundu…”, “visu dienu bez…”, nereāli laika bloki.
- morning_prayer: katrā rītā vismaz VIENS īss aizlūgums par citiem (ģimene/draugi/skola*/satiktie) — rotē; *skola tikai ja SKOLAS KONTEKSTS atļauj.
- evening_prayer: examen = atskats; resolution = īss spēka lūgums; **closing = GALVENĀ vakara lūgšana** (sargā mani un ģimeni, naktsmiers, veselība, sargā no ļauna/nelaimēm/slimībām + Āmen). Nedrīkst, ka vakars ir tikai jautājumi bez īstas lūgšanas.
- STINGRI ievēro SKOLAS KONTEKSTU augstāk: brīvlaikā un sestdienā–svētdienā bez skolas/klasesbiedru/skolotāju situācijām.
${lengthRules}
`;

  const gamesJson = JSON.stringify(
    games.map((g) => ({
      id: g.id,
      name: g.name,
      best_for: g.best_for,
      mode: g.mode,
      notes: g.notes,
    })),
    null,
    2,
  );

  const user = isPublicBand
    ? `REŽĪMS: publiskais standarta saturs (nav vecāku personalizācijas; nav precīza vecuma gados — tikai josla)
VECUMA GRUPA: ${bandMeta?.label ?? bandId} (aptuvenais vecums promptam: ${input.age})

${dayContext}

${bandGuide}

ŠODIENAS LITURĢISKIE TEKSTI:
${readingsPayload ? JSON.stringify(readingsPayload, null, 2) : input.scriptureText}

NESENĀS SPĒLES ŠAI GRUPAI (izvairies no atkārtošanas):
${input.recentGameTypes.join(", ") || "nav"}

SPĒĻU KATALOGS (tā pati spēļu sistēma kā personalizētajā lietotnē; izvēlies vecumam derīgu tipu):
${gamesJson}

Uzdevums: izveido šodienas saturu latviešu valodā. Evaņģēlijs ir galvenais. Spēle + JSON struktūra kā privātajā aplikācijā; GARUMS, tonis un vakara jautājumi — pēc šīs vecuma grupas.`
    : `REŽĪMS: personalizēts bērns
BĒRNA VECUMS: ${input.age}
VECUMA GRUPA (bāze): ${bandMeta?.label ?? bandId}

${dayContext}

${bandGuide}

PERSONALIZĒTS PROFILS (neredzams bērnam; TIKAI ja dabiski saskan ar Evaņģēliju):
${input.profile.trim() || "(tukšs — izmanto tikai vecuma grupas bāzi)"}

ŠODIENAS LITURĢISKIE TEKSTI:
${readingsPayload ? JSON.stringify(readingsPayload, null, 2) : input.scriptureText}

NESENĀS SPĒLES (izvairies no atkārtošanas):
${input.recentGameTypes.join(", ") || "nav"}

SPĒĻU KATALOGS:
${gamesJson}

Uzdevums: izveido šodienas saturu latviešu valodā. Evaņģēlijs ir galvenais. Forma/garums/tonis — pēc vecuma grupas. “Ko tas nozīmē?” (explanation + main_idea) = teksta skaidrojums ar ticības kodolu + (ja dabiski) dzīves saikni — ne tikai “esi labs”, ne profils; profils — tikai dabiska, neredzama niansēšana citur (piem. real_life_application).`;

  const messages: ChatMessage[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

  let lastError: Error | null = null;

  for (let i = 0; i < models.length; i++) {
    const model = models[i]!;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const raw = await chatCompletionWithModel(messages, model);
        const content = dailyLessonContentSchema.parse(extractJson(raw));
        if (i > 0) {
          console.warn(`[ai] Nodarbībai izmanto fallback modeli: ${model}`);
        }
        return { content, provider: "openai-compatible", model };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const msg = lastError.message;
        const quota =
          /AI kļūda (429|404)/.test(msg) ||
          isQuotaOrUnavailableError(0, msg);

        if (quota) {
          if (i < models.length - 1) {
            console.warn(
              `[ai] Modelis ${model} limits/nav pieejams. Mēģinu nākamo.`,
            );
          }
          break;
        }

        // Bad JSON / schema: one retry on same model, then next model.
        if (attempt === 0) continue;
        if (i < models.length - 1) {
          console.warn(
            `[ai] Modelis ${model} neatbilst shēmai. Mēģinu nākamo.`,
          );
          break;
        }
      }
    }
  }

  throw lastError || new Error("AI kļūda: visi modeļi neizdevās.");
}
