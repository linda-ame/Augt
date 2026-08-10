import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import {
  getKidSession,
  getParentViewChild,
} from "@/lib/kid-session";
import { assertReadableDate, pastWeekDates, todayInRiga } from "@/lib/dates";
import { DailyLessonView } from "@/components/DailyLessonView";
import { GuestDayView } from "@/components/GuestDayView";
import type { DailyLessonContent, ScriptureReading } from "@/lib/types";
import { ensureReadingRoles } from "@/lib/reading-roles";
import { getGuestAgeBand } from "@/lib/guest-age";
import { getAgeBand, guestChildId } from "@/lib/age-bands";

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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const parentViewChildId = user ? await getParentViewChild() : null;
  const kidSession = await getKidSession();
  const guestBand = await getGuestAgeBand();

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

  const admin = createServiceClient();

  const { data: reading } = await admin
    .from("daily_readings")
    .select("source_text, readings, daily_quote")
    .eq("reading_date", date)
    .maybeSingle();

  const readings = ensureReadingRoles(
    (reading?.readings as ScriptureReading[] | null) ?? [],
  );

  if (isGuest && guestBand) {
    const { data: bandLesson } = await admin
      .from("age_band_lessons")
      .select("content_json, generation_status")
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
          dates={pastWeekDates()}
          displayName={displayName}
          childId={childId}
          content={content}
          readings={readings}
          dailyQuote={reading?.daily_quote ?? null}
          status={status}
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
        dates={pastWeekDates()}
        ageBandId={guestBand}
        readings={readings}
        dailyQuote={reading?.daily_quote ?? null}
        generationStatus={status}
      />
    );
  }

  const { data: childRow } = await admin
    .from("children")
    .select("display_name, age")
    .eq("id", childId)
    .maybeSingle();
  if (childRow?.display_name) displayName = childRow.display_name;

  const { data: lesson } = await admin
    .from("daily_lessons")
    .select("content_json, generation_status")
    .eq("child_id", childId)
    .eq("reading_date", date)
    .maybeSingle();

  return (
    <DailyLessonView
      date={date}
      dates={pastWeekDates()}
      displayName={displayName}
      childId={childId}
      content={(lesson?.content_json as DailyLessonContent) ?? null}
      readings={readings}
      dailyQuote={reading?.daily_quote ?? null}
      status={lesson?.generation_status ?? "missing"}
      isParentPreview={isParentPreview}
      splitOptionalReadings={
        typeof childRow?.age === "number" ? childRow.age <= 12 : false
      }
    />
  );
}
