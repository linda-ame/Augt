import { createServiceClient } from "@/lib/supabase/admin";
import type { AgeBandId } from "@/lib/age-bands";
import type { DailyLessonContent, ScriptureReading } from "@/lib/types";
import { buildGospelListenScript } from "@/services/ai/gospel-listen-script";
import { synthesizeSpeechWav } from "@/services/ai/tts";

const BUCKET = "lesson-audio";

function gospelReadingText(readings: ScriptureReading[] | null | undefined) {
  if (!readings?.length) return null;
  const gospel =
    readings.find((r) => r.role === "gospel") ||
    readings.find((r) => /evaņģēlij/i.test(r.label || ""));
  return gospel?.text?.trim() || null;
}

/** Soft-fail safe: generate + store gospel listen audio for an age-band lesson. */
export async function ensureAgeBandGospelAudio(options: {
  date: string;
  ageBandId: AgeBandId;
  content: DailyLessonContent;
  readings?: ScriptureReading[] | null;
  force?: boolean;
}): Promise<{ url: string | null; skipped?: boolean; error?: string }> {
  const admin = createServiceClient();
  const { date, ageBandId, content, force } = options;

  const { data: row } = await admin
    .from("age_band_lessons")
    .select("id, gospel_audio_url")
    .eq("reading_date", date)
    .eq("age_band", ageBandId)
    .maybeSingle();

  if (!force && row?.gospel_audio_url) {
    return { url: row.gospel_audio_url, skipped: true };
  }

  const script = buildGospelListenScript(content, {
    gospelReadingText: gospelReadingText(options.readings),
  });
  if (!script) {
    return { url: null, error: "Nav evaņģēlija satura TTS." };
  }

  try {
    const wav = await synthesizeSpeechWav(script);
    const path = `${date}/${ageBandId}/gospel.wav`;

    const { error: upErr } = await admin.storage.from(BUCKET).upload(path, wav, {
      contentType: "audio/wav",
      upsert: true,
    });
    if (upErr) throw upErr;

    const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
    const url = `${pub.publicUrl}?v=${Date.now()}`;

    const { error: dbErr } = await admin
      .from("age_band_lessons")
      .update({ gospel_audio_url: url })
      .eq("reading_date", date)
      .eq("age_band", ageBandId);
    if (dbErr) throw dbErr;

    return { url };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      `[tts] age_band ${ageBandId} ${date}: ${message.slice(0, 200)}`,
    );
    return { url: null, error: message };
  }
}
