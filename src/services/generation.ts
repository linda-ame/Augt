import { createServiceClient } from "@/lib/supabase/admin";
import { todayInRiga } from "@/lib/dates";
import {
  AGE_BANDS,
  approximateAge,
  type AgeBandId,
} from "@/lib/age-bands";
import {
  normalizeParentNotes,
  type ParentNotes,
} from "@/lib/parent-notes";
import { getScriptureSource } from "@/services/scriptureSource";
import {
  generateChildProfile,
  generateDailyLesson,
} from "@/services/ai/generate";
import { ensureAgeBandGospelAudio } from "@/services/gospel-audio";
import type { ScriptureReading } from "@/lib/types";

export async function ensureTodaysReading(
  date = todayInRiga(),
  options?: { forceRefresh?: boolean },
) {
  const admin = createServiceClient();
  const { data: existing } = await admin
    .from("daily_readings")
    .select("*")
    .eq("reading_date", date)
    .maybeSingle();

  const readings = (existing?.readings as { role?: string }[] | null) ?? [];
  const hasRoles = readings.some((r) => Boolean(r.role));
  if (existing && hasRoles && !options?.forceRefresh) {
    return existing;
  }

  const scripture = await getScriptureSource().fetchForDate(date);
  const { data, error } = await admin
    .from("daily_readings")
    .upsert(
      {
        reading_date: date,
        liturgical_day: scripture.liturgicalDay ?? null,
        daily_quote: scripture.dailyQuote ?? null,
        source_url: scripture.sourceUrl,
        readings: scripture.readings,
        source_text: scripture.sourceText,
        retrieved_at: new Date().toISOString(),
      },
      { onConflict: "reading_date" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

/** Generate a draft profile from parent notes (awaits parent approval). */
export async function draftChildProfile(
  childId: string,
  notesOverride?: ParentNotes,
) {
  const admin = createServiceClient();
  const { data: child, error } = await admin
    .from("children")
    .select("*")
    .eq("id", childId)
    .single();
  if (error || !child) throw error || new Error("Bērns nav atrasts.");

  const notes = normalizeParentNotes(notesOverride ?? child.parent_notes);
  const profile = await generateChildProfile({
    age: child.age,
    notes,
  });

  const patch: Record<string, unknown> = {
    parent_notes: notes,
    profile_draft: profile,
    profile_status: "draft",
  };
  if (notesOverride) {
    patch.notes_version = (child.notes_version ?? 0) + 1;
  }

  const { data: updated, error: upErr } = await admin
    .from("children")
    .update(patch)
    .eq("id", childId)
    .select("*")
    .single();
  if (upErr) throw upErr;
  return updated;
}

/** Approve draft (or edited text) and use it for daily generation. */
export async function approveChildProfile(
  childId: string,
  options?: { profileText?: string; generateToday?: boolean },
) {
  const admin = createServiceClient();
  const { data: child, error } = await admin
    .from("children")
    .select("*")
    .eq("id", childId)
    .single();
  if (error || !child) throw error || new Error("Bērns nav atrasts.");

  const profileText = (options?.profileText ?? child.profile_draft ?? "").trim();
  if (!profileText) {
    throw new Error(
      "Nav profila teksta, ko apstiprināt. Vispirms ģenerē melnrakstu.",
    );
  }

  const { data: updated, error: upErr } = await admin
    .from("children")
    .update({
      generated_profile: profileText,
      profile_draft: profileText,
      profile_status: "approved",
      profile_version: (child.profile_version ?? 0) + 1,
      profile_approved_at: new Date().toISOString(),
    })
    .eq("id", childId)
    .select("*")
    .single();
  if (upErr) throw upErr;

  if (options?.generateToday === false) {
    return { child: updated, lesson: null };
  }

  const lesson = await generateLessonForChild(childId, { force: true });
  return { child: updated, lesson };
}

/** @deprecated Prefer draftChildProfile + approveChildProfile. */
export async function regenerateChildProfile(childId: string) {
  return draftChildProfile(childId);
}

export async function generateLessonForChild(
  childId: string,
  options?: { date?: string; force?: boolean },
) {
  const admin = createServiceClient();
  const date = options?.date ?? todayInRiga();
  const force = options?.force ?? false;

  const { data: child, error } = await admin
    .from("children")
    .select("*")
    .eq("id", childId)
    .single();
  if (error || !child) throw error || new Error("Bērns nav atrasts.");

  if (!force) {
    const { data: existing } = await admin
      .from("daily_lessons")
      .select("id, generation_status")
      .eq("child_id", childId)
      .eq("reading_date", date)
      .maybeSingle();
    if (existing?.generation_status === "success") {
      return { skipped: true as const, reason: "already_exists" };
    }
  }

  const approved =
    child.profile_status === "approved" &&
    typeof child.generated_profile === "string" &&
    child.generated_profile.trim().length > 0;
  // Legacy rows may have a profile without status (pre-migration); treat as usable.
  const legacyProfile =
    (!child.profile_status || child.profile_status === "none") &&
    typeof child.generated_profile === "string" &&
    child.generated_profile.trim().length > 0;
  const profile = approved
    ? (child.generated_profile as string)
    : legacyProfile
      ? (child.generated_profile as string)
      : "";

  const reading = await ensureTodaysReading(date, { forceRefresh: force });

  const { data: recent } = await admin
    .from("daily_lessons")
    .select("content_json")
    .eq("child_id", childId)
    .eq("generation_status", "success")
    .order("reading_date", { ascending: false })
    .limit(7);

  const recentGameTypes =
    recent
      ?.map((r) => {
        const json = r.content_json as {
          activity?: { type?: string };
          gospel?: { activity?: { type?: string } };
        };
        return json?.gospel?.activity?.type || json?.activity?.type;
      })
      .filter((t): t is string => Boolean(t)) ?? [];

  try {
    const { content, provider, model } = await generateDailyLesson({
      age: child.age,
      profile: profile!,
      date,
      scriptureText: reading.source_text,
      readings: (reading.readings as import("@/lib/types").ScriptureReading[]) ?? [],
      recentGameTypes,
    });

    const { data: lesson, error: lessonErr } = await admin
      .from("daily_lessons")
      .upsert(
        {
          reading_date: date,
          child_id: childId,
          reading_id: reading.id,
          content_json: content,
          generation_status: "success",
          ai_provider: provider,
          ai_model: model,
          error_message: null,
          generated_at: new Date().toISOString(),
        },
        { onConflict: "reading_date,child_id" },
      )
      .select("*")
      .single();
    if (lessonErr) throw lessonErr;
    return { skipped: false as const, lesson };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nezināma kļūda";
    await admin.from("daily_lessons").upsert(
      {
        reading_date: date,
        child_id: childId,
        reading_id: reading.id,
        generation_status: "failed",
        error_message: message,
        generated_at: new Date().toISOString(),
      },
      { onConflict: "reading_date,child_id" },
    );
    throw err;
  }
}

/** Public / guest standard lesson for one age band. */
export async function generateLessonForAgeBand(
  ageBandId: AgeBandId,
  options?: { date?: string; force?: boolean },
) {
  const admin = createServiceClient();
  const date = options?.date ?? todayInRiga();
  const force = options?.force ?? false;

  const reading = await ensureTodaysReading(date, { forceRefresh: force });
  const readings = (reading.readings as ScriptureReading[]) ?? [];

  if (!force) {
    const { data: existing } = await admin
      .from("age_band_lessons")
      .select("id, generation_status, content_json, gospel_audio_url")
      .eq("age_band", ageBandId)
      .eq("reading_date", date)
      .maybeSingle();
    if (existing?.generation_status === "success" && existing.content_json) {
      const audio = await ensureAgeBandGospelAudio({
        date,
        ageBandId,
        content: existing.content_json as import("@/lib/types").DailyLessonContent,
        readings,
      });
      return {
        skipped: true as const,
        reason: "already_exists",
        audio,
        lesson: existing,
      };
    }
  }

  const { data: recent } = await admin
    .from("age_band_lessons")
    .select("content_json")
    .eq("age_band", ageBandId)
    .eq("generation_status", "success")
    .order("reading_date", { ascending: false })
    .limit(7);

  const recentGameTypes =
    recent
      ?.map((r) => {
        const json = r.content_json as {
          gospel?: { activity?: { type?: string } };
        };
        return json?.gospel?.activity?.type;
      })
      .filter((t): t is string => Boolean(t)) ?? [];

  try {
    const { content, provider, model } = await generateDailyLesson({
      age: approximateAge(ageBandId),
      profile: "",
      ageBandId,
      date,
      scriptureText: reading.source_text,
      readings,
      recentGameTypes,
    });

    const { data: lesson, error: lessonErr } = await admin
      .from("age_band_lessons")
      .upsert(
        {
          reading_date: date,
          age_band: ageBandId,
          reading_id: reading.id,
          content_json: content,
          generation_status: "success",
          ai_provider: provider,
          ai_model: model,
          error_message: null,
          generated_at: new Date().toISOString(),
        },
        { onConflict: "reading_date,age_band" },
      )
      .select("*")
      .single();
    if (lessonErr) throw lessonErr;

    // Soft-fail: content stays even if TTS quota/API fails.
    const audio = await ensureAgeBandGospelAudio({
      date,
      ageBandId,
      content,
      readings,
      force: true,
    });

    return { skipped: false as const, lesson, audio };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nezināma kļūda";
    await admin.from("age_band_lessons").upsert(
      {
        reading_date: date,
        age_band: ageBandId,
        reading_id: reading.id,
        generation_status: "failed",
        error_message: message,
        generated_at: new Date().toISOString(),
      },
      { onConflict: "reading_date,age_band" },
    );
    throw err;
  }
}

export async function generateLessonsForAllAgeBands(options?: {
  date?: string;
  force?: boolean;
}) {
  const results: unknown[] = [];
  for (let i = 0; i < AGE_BANDS.length; i++) {
    const band = AGE_BANDS[i]!;
    if (i > 0) {
      await new Promise((r) => setTimeout(r, 12_000));
    }
    try {
      const result = await generateLessonForAgeBand(band.id, options);
      results.push({ ageBand: band.id, result });
    } catch (err) {
      results.push({
        ageBand: band.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return results;
}

/** After parent approves profile: regenerate draft is separate; this only builds today's lesson. */
export async function onChildProfileReady(childId: string) {
  return generateLessonForChild(childId, { force: true });
}

export async function generateDailyForAllActiveChildren(trigger: string) {
  const admin = createServiceClient();
  const date = todayInRiga();
  const { data: run } = await admin
    .from("generation_runs")
    .insert({ run_date: date, trigger, status: "running" })
    .select("*")
    .single();

  const details: Record<string, unknown> = { children: [], ageBands: [] };

  try {
    await ensureTodaysReading(date);

    details.ageBands = await generateLessonsForAllAgeBands({ date });

    const { data: children, error } = await admin
      .from("children")
      .select("id, display_name")
      .eq("active", true);
    if (error) throw error;

    for (const child of children ?? []) {
      try {
        const result = await generateLessonForChild(child.id);
        (details.children as unknown[]).push({
          id: child.id,
          name: child.display_name,
          result,
        });
      } catch (err) {
        (details.children as unknown[]).push({
          id: child.id,
          name: child.display_name,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    if (run) {
      await admin
        .from("generation_runs")
        .update({
          status: "success",
          finished_at: new Date().toISOString(),
          details,
        })
        .eq("id", run.id);
    }
    return details;
  } catch (err) {
    if (run) {
      await admin
        .from("generation_runs")
        .update({
          status: "failed",
          finished_at: new Date().toISOString(),
          details: {
            ...details,
            error: err instanceof Error ? err.message : String(err),
          },
        })
        .eq("id", run.id);
    }
    throw err;
  }
}
