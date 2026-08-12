import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import {
  getKidSession,
  getParentViewChild,
} from "@/lib/kid-session";
import { assertReadableDate, filterDatesWithReadings, pastWeekDates, todayInRiga } from "@/lib/dates";
import { DailyLessonView } from "@/components/DailyLessonView";
import { GuestDayView } from "@/components/GuestDayView";
import type { DailyLessonContent, ScriptureReading } from "@/lib/types";
import { ensureReadingRoles } from "@/lib/reading-roles";
import { getGuestAgeBand } from "@/lib/guest-age";
import {
  ageBandFromAge,
  getAgeBand,
  guestChildId,
  type AgeBandId,
} from "@/lib/age-bands";

export const dynamic = "force-dynamic";

export default async function KidPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const date = params.date || todayInRiga();
  try {
    assertReadableDate(date);
  } catch {
    redirect(`/kid?date=${todayInRiga()}`);
  }

  const supabase = await createClient();
  const admin = createServiceClient();

  const weekDates = pastWeekDates();
  const today = todayInRiga();

  // Parallel: auth + sessions + reading for this date + which week days have liturgy.
  const [{ data: authData }, parentViewChildId, kidSession, guestBand, readingRes, weekReadingsRes] =
    await Promise.all([
      supabase.auth.getUser(),
      getParentViewChild(),
      getKidSession(),
      getGuestAgeBand(),
      admin
        .from("daily_readings")
        .select("source_text, readings, daily_quote")
        .eq("reading_date", date)
        .maybeSingle(),
      admin
        .from("daily_readings")
        .select("reading_date, readings")
        .in("reading_date", weekDates),
    ]);

  const user = authData.user;
  const reading = readingRes.data;
  const readings = ensureReadingRoles(
    (reading?.readings as ScriptureReading[] | null) ?? [],
  );
  const datesWithReadings = (weekReadingsRes.data ?? [])
    .filter((row) => Array.isArray(row.readings) && row.readings.length > 0)
    .map((row) => row.reading_date as string);
  const dates = filterDatesWithReadings(weekDates, datesWithReadings, new Date());
  const dailyQuote = reading?.daily_quote ?? null;

  // Deep link to an empty past day → send to today.
  if (!dates.includes(date)) {
    redirect(`/kid?date=${today}`);
  }

  let childId: string | null = null;
  let displayName = "";
  let isParentPreview = false;
  let isGuest = false;

  if (user && parentViewChildId) {
    const { data: family } = await supabase
      .from("families")
      .select("id")
      .eq("owner_user_id", user.id)
      .maybeSingle();
    if (!family) redirect("/parent");
    const { data: child } = await supabase
      .from("children")
      .select("id, display_name")
      .eq("id", parentViewChildId)
      .eq("family_id", family.id)
      .maybeSingle();
    if (!child) redirect("/parent");
    childId = child.id;
    displayName = child.display_name;
    isParentPreview = true;
  } else if (kidSession) {
    childId = kidSession.childId;
    displayName = kidSession.displayName;
  } else if (guestBand) {
    isGuest = true;
    childId = guestChildId(guestBand);
    displayName = getAgeBand(guestBand).label;
  } else if (user) {
    redirect("/parent");
  } else {
    redirect("/");
  }

  if (!childId) redirect("/");

  if (isGuest && guestBand) {
    const { data: bandLesson } = await admin
      .from("age_band_lessons")
      .select("content_json, generation_status, gospel_audio_url")
      .eq("age_band", guestBand)
      .eq("reading_date", date)
      .maybeSingle();

    const status = bandLesson?.generation_status ?? "missing";
    const content =
      (bandLesson?.content_json as DailyLessonContent | null) ?? null;

    if (status === "success" && content) {
      return (
        <DailyLessonView
          date={date}
          dates={dates}
          displayName={displayName}
          childId={childId}
          content={content}
          readings={readings}
          dailyQuote={dailyQuote}
          status={status}
          gospelAudioUrl={bandLesson?.gospel_audio_url ?? null}
          isGuest
          splitOptionalReadings={
            guestBand === "age_7_9" || guestBand === "age_10_12"
          }
        />
      );
    }

    return (
      <GuestDayView
        date={date}
        dates={dates}
        ageBandId={guestBand}
        readings={readings}
        dailyQuote={dailyQuote}
        generationStatus={status}
      />
    );
  }

  const [{ data: childRow }, { data: lesson }] = await Promise.all([
    admin
      .from("children")
      .select("display_name, age")
      .eq("id", childId)
      .maybeSingle(),
    admin
      .from("daily_lessons")
      .select("content_json, generation_status")
      .eq("child_id", childId)
      .eq("reading_date", date)
      .maybeSingle(),
  ]);

  if (childRow?.display_name) displayName = childRow.display_name;

  let content = (lesson?.content_json as DailyLessonContent | null) ?? null;
  let status = lesson?.generation_status ?? "missing";
  let gospelAudioUrl: string | null = null;

  // If personalized lesson is missing, fall back to the shared age-band lesson
  // so past/current days stay readable when cron filled age_band_lessons.
  const band: AgeBandId | null =
    typeof childRow?.age === "number" ? ageBandFromAge(childRow.age) : null;
  if (band) {
    const { data: bandLesson } = await admin
      .from("age_band_lessons")
      .select("content_json, generation_status, gospel_audio_url")
      .eq("age_band", band)
      .eq("reading_date", date)
      .maybeSingle();
    gospelAudioUrl = bandLesson?.gospel_audio_url ?? null;
    if (status !== "success" || !content) {
      if (
        bandLesson?.generation_status === "success" &&
        bandLesson.content_json
      ) {
        content = bandLesson.content_json as DailyLessonContent;
        status = "success";
      } else if (bandLesson?.generation_status) {
        status = bandLesson.generation_status;
      }
    }
  }

  return (
    <DailyLessonView
      date={date}
      dates={dates}
      displayName={displayName}
      childId={childId}
      content={content}
      readings={readings}
      dailyQuote={dailyQuote}
      status={status}
      gospelAudioUrl={gospelAudioUrl}
      isParentPreview={isParentPreview}
      splitOptionalReadings={
        typeof childRow?.age === "number" ? childRow.age <= 12 : false
      }
    />
  );
}
