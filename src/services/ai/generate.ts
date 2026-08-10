import { readFileSync } from "fs";
import path from "path";
import { ageBandGenerationGuide } from "@/services/ai/age-band-guide";
import { AGE_BANDS, type AgeBandId } from "@/lib/age-bands";
import {
  dailyLessonContentSchema,
  type DailyLessonContent,
  type ScriptureReading,
} from "@/lib/types";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/** Best → mid → lite. Used when AI_MODELS is unset. */
const DEFAULT_GEMINI_MODEL_CHAIN = [
  "gemini-3.5-flash",
  "gemini-2.0-flash",
  "gemini-3.5-flash-lite",
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

export function loadTeachingGoals() {
  const file = path.join(process.cwd(), "ai", "teaching-goals.json");
  return JSON.parse(readFileSync(file, "utf8")) as {
    categories?: Array<{ id: string; name: string; name_en?: string }>;
    goals: Array<{
      id: string;
      name: string;
      category: string;
      category_id?: string;
      description: string;
      name_en?: string;
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

/** Keep profile prompts small even if parent selected hundreds of goals. */
function compactGoalsForProfile(
  goals: Array<{ id: string; name: string; category: string; category_id?: string }>,
  maxGoals = 36,
) {
  const byCategory = new Map<string, typeof goals>();
  for (const g of goals) {
    const key = g.category_id || g.category;
    const list = byCategory.get(key) || [];
    list.push(g);
    byCategory.set(key, list);
  }

  const picked: typeof goals = [];
  const categories = Array.from(byCategory.keys());
  let i = 0;
  while (picked.length < maxGoals && categories.length > 0) {
    const cat = categories[i % categories.length];
    const list = byCategory.get(cat)!;
    if (list.length > 0) {
      picked.push(list.shift()!);
    }
    if (list.length === 0) {
      categories.splice(i % categories.length, 1);
      if (categories.length === 0) break;
      continue;
    }
    i++;
  }

  const countMap = new Map<string, { category: string; selected_count: number }>();
  for (const g of goals) {
    const key = g.category_id || g.category;
    const cur = countMap.get(key) || { category: g.category, selected_count: 0 };
    cur.selected_count += 1;
    countMap.set(key, cur);
  }

  return {
    goals_for_prompt: picked.map((g) => ({
      name: g.name,
      category: g.category,
    })),
    category_summary: Array.from(countMap.values()),
    total_selected: goals.length,
  };
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
  goalIds: string[];
}): Promise<string> {
  const goalsLib = loadTeachingGoals();
  const selected = goalsLib.goals.filter((g) => input.goalIds.includes(g.id));
  const compact = compactGoalsForProfile(selected);

  const system = `${loadSystemRules()}

Uzdevums: izveido KOMPAKTU bērna personalizācijas profilu (latviešu valodā), ko izmantos ikdienas ģenerēšanai.
Nekad neminēt, ka tie ir "problēmas". Profils ir pozitīvs, tikumu un pieejas apraksts.
Ja mērķu ir daudz, apkopo galvenās tēmas, nevis uzskaiti katru punktu.
Atbildi JSON: { "profile": "..." }`;

  const user = JSON.stringify(
    {
      age: input.age,
      total_selected_goals: compact.total_selected,
      category_summary: compact.category_summary,
      representative_goals: compact.goals_for_prompt,
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
  /** When set: public standard content for that age band (no child personalization). */
  ageBandId?: AgeBandId;
}): Promise<{ content: DailyLessonContent; provider: string; model: string }> {
  const models = resolveModelChain();
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

  const bandSpec = input.ageBandId
    ? loadAgeBandSpec(input.ageBandId)
    : null;
  const principles = input.ageBandId ? loadCatholicPrinciples() : null;
  const bandMeta = input.ageBandId
    ? AGE_BANDS.find((b) => b.id === input.ageBandId)
    : null;

  const bandGuide = input.ageBandId
    ? ageBandGenerationGuide(input.ageBandId)
    : null;

  const systemPrefix = principles
    ? `${principles}

---

${loadSystemRules()}

---

VECUMA GRUPAS SPECIFIKĀCIJA (${bandMeta?.label ?? input.ageBandId}):
${bandSpec}

---

${bandGuide}

---`
    : loadSystemRules();

  const examenSchemaHint = input.ageBandId
    ? `"examen_questions": string[]  // skaits un tēmas — skat. VECUMA GRUPAS vadlīnijas zemāk (3–6 jautājumi)`
    : `"examen_questions": [string, string, string]`;

  const lengthRules = input.ageBandId
    ? `- PUBLISKAIS STANDARTA saturs: BEZ bērna profila. PRIORITĀTE: vecuma grupas specifikācija + vadlīnijas zemāk (garumi, tonis, examen).
- system-rules JSON struktūra (rīts/evaņģēlijs/spēle/vakars/parts) PALIEK, bet GARUMI un examen_questions SEKO vecuma grupai, ne “vienam izmēram visiem”.
- JA system-rules saka “tieši 3 examen_questions” vai fiksētus ~60–90 vārdus — šajā režīmā UZVAR vecuma grupas vadlīnijas.
- Saturs ŠAI grupai nedrīkst būt gandrīz identisks citai vecuma grupai (cits dziļums, citi piemēri, cits garums).`
    : `- morning_prayer un evening_prayer OBLIGĀTI; ĪSI (rīts ~60–90 vārdi; vakara teksts bez jautājumiem ~70–120).
- morning_prayer: katrā rītā vismaz VIENS īss aizlūgums par citiem (ģimene / draugi / skola / kādu, ko satikšu) — rotē, ne katru rītu viss saraksts.
- examen_questions: 3 vai 4 īsi jautājumi — pateicība; labs darbs; vai kādam vajadzētu atvainoties; ko vēlos uzticēt Dievam (bez kaunināšanas).
- resolution: ĪSS LŪGUMS pēc spēka/palīdzības (“Jēzu, palīdzi man…”), NE “rīt es izdarīšu X”.
- evening_prayer.closing: ĪSTA vakara lūgšana (ne atskats) — sargā mani un ģimeni; naktsmiers; veselība; sargā no ļauna/nelaimēm/slimībām + Āmen. Nedrīkst būt tikai “labu nakti”.
- gospel.real_life_application: mazs, šodien izpildāms ierosinājums (ne lieli laika bloki / “rīt pirmo pusstundu…”).`;

  const system = `${systemPrefix}

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
- Spēle un Evaņģēlija lūgšana TIKAI gospel objektā.
- gospel.activity VIENMĒR ietver "type", "instruction" un "explanation".
- Quiz spēlēm: "correct_answer" vai "answer"; explanation NEUTRĀLS (bez „Lieliski!” / „Pareizi!”).
- scenario_choice / choose_the_best_response: options (2–3), correct_answer (indekss), explanation (silts).
- gospel.real_life_application: **mazs, izpildāms** ierosinājums šodienai (īsa izvēle / dažas minūtes). Nedrīkst: “rīt pirmo pusstundu…”, “visu dienu bez…”, nereāli laika bloki.
- morning_prayer: katrā rītā vismaz VIENS īss aizlūgums par citiem (ģimene/draugi/skola/satiktie) — rotē, ne viss saraksts katru rītu.
- evening_prayer: examen = atskats; resolution = īss spēka lūgums; **closing = GALVENĀ vakara lūgšana** (sargā mani un ģimeni, naktsmiers, veselība, sargā no ļauna/nelaimēm/slimībām + Āmen). Nedrīkst, ka vakars ir tikai jautājumi bez īstas lūgšanas.
${lengthRules}
`;

  const user = input.ageBandId
    ? `REŽĪMS: publiskais standarta saturs (nav izvēlētu mērķu / īpašību; nav precīza vecuma gados — tikai josla)
VECUMA GRUPA: ${bandMeta?.label ?? input.ageBandId} (aptuvenais vecums promptam: ${input.age})

${bandGuide}

ŠODIENAS LITURĢISKIE TEKSTI:
${readingsPayload ? JSON.stringify(readingsPayload, null, 2) : input.scriptureText}

NESENĀS SPĒLES ŠAI GRUPAI (izvairies no atkārtošanas):
${input.recentGameTypes.join(", ") || "nav"}

SPĒĻU KATALOGS (tā pati spēļu sistēma kā personalizētajā lietotnē; izvēlies vecumam derīgu tipu):
${JSON.stringify(games.map((g) => ({ id: g.id, name: g.name, best_for: g.best_for, mode: g.mode, notes: g.notes })), null, 2)}

Uzdevums: izveido šodienas saturu latviešu valodā. Evaņģēlijs ir galvenais. Spēle + JSON struktūra kā privātajā aplikācijā; GARUMS, tonis un vakara jautājumi — pēc šīs vecuma grupas.`
    : `BĒRNA VECUMS: ${input.age}

PERSONALIZĒTS PROFILS (neredzams bērnam):
${input.profile}

ŠODIENAS LITURĢISKIE TEKSTI:
${readingsPayload ? JSON.stringify(readingsPayload, null, 2) : input.scriptureText}

NESENĀS SPĒLES (izvairies no atkārtošanas):
${input.recentGameTypes.join(", ") || "nav"}

SPĒĻU KATALOGS:
${JSON.stringify(games.map((g) => ({ id: g.id, name: g.name, best_for: g.best_for, mode: g.mode, notes: g.notes })), null, 2)}

Uzdevums: izveido šodienas saturu latviešu valodā. Evaņģēlijs ir galvenais.`;

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
