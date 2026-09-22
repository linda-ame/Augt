import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { BrandLogo } from "@/components/BrandLogo";
import { DailyLessonView } from "@/components/DailyLessonView";
import { ParentContentPicker } from "@/components/ParentContentPicker";
import {
  assertReadableDate,
  filterDatesWithReadings,
  pastWeekDates,
  todayInRiga,
} from "@/lib/dates";
import { getParentViewChild } from "@/lib/kid-session";
import { ensureOwnedFamily } from "@/lib/family";
import { ensureReadingRoles } from "@/lib/reading-roles";
import { ageBandFromAge, type AgeBandId } from "@/lib/age-bands";
import type { DailyLessonContent, ScriptureReading } from "@/lib/types";
import { sanitizeDailyQuote } from "@/services/scriptureSource";

export const dynamic = "force-dynamic";

export default async function ParentContentPage({
  searchParams,
}: {
  searchParams: Promise<{ childId?: string; date?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?mode=parent");

  const parentViewChildId = await getParentViewChild();
  if (parentViewChildId) redirect("/kid");

  const familyName =
    (user.user_metadata?.family_name as string | undefined)?.trim() ||
    "Mana ģimene";
  const family = await ensureOwnedFamily(supabase, user.id, familyName);
  if (!family) redirect("/parent");

  const { data: children } = await supabase
    .from("children")
    .select("id, display_name, age")
    .eq("family_id", family.id)
    .order("display_name");

  const childrenList = children ?? [];
  if (childrenList.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <header className="flex items-start justify-between gap-4">
          <BrandLogo href="/parent" size="md" />
          <Link href="/parent" className="btn btn-secondary !px-3 !py-1.5 text-sm">
            Atpakaļ
          </Link>
        </header>
        <section className="panel section-enter mt-8 p-6">
          <h1 className="brand-mark text-2xl">Bērnu saturs</h1>
          <p className="mt-3 text-[var(--ink-soft)]">
            Vispirms pievieno bērnu vecāku sākumā, tad šeit varēsi skatīt dienas
            saturu.
          </p>
        </section>
      </main>
    );
  }

  const requestedId = params.childId?.trim() || "";
  const selected =
    childrenList.find((c) => c.id === requestedId) ?? childrenList[0];

  if (requestedId && requestedId !== selected.id) {
    redirect(
      `/parent/content?childId=${encodeURIComponent(selected.id)}&date=${encodeURIComponent(params.date || todayInRiga())}`,
    );
  }

  const date = params.date || todayInRiga();
  try {
    assertReadableDate(date);
  } catch {
    redirect(
      `/parent/content?childId=${encodeURIComponent(selected.id)}&date=${todayInRiga()}`,
    );
  }

  const admin = createServiceClient();
  const weekDates = pastWeekDates();
  const today = todayInRiga();

  const [readingRes, weekReadingsRes, lessonRes] = await Promise.all([
    admin
      .from("daily_readings")
      .select("source_text, readings, daily_quote")
      .eq("reading_date", date)
      .maybeSingle(),
    admin
      .from("daily_readings")
      .select("reading_date, readings")
      .in("reading_date", weekDates),
    admin
      .from("daily_lessons")
      .select("content_json, generation_status")
      .eq("child_id", selected.id)
      .eq("reading_date", date)
      .maybeSingle(),
  ]);

  const reading = readingRes.data;
  const readings = ensureReadingRoles(
    (reading?.readings as ScriptureReading[] | null) ?? [],
  );
  const datesWithReadings = (weekReadingsRes.data ?? [])
    .filter((row) => Array.isArray(row.readings) && row.readings.length > 0)
    .map((row) => row.reading_date as string);
  const dates = filterDatesWithReadings(weekDates, datesWithReadings, new Date());
  const dailyQuote = sanitizeDailyQuote(reading?.daily_quote);

  if (!dates.includes(date)) {
    redirect(
      `/parent/content?childId=${encodeURIComponent(selected.id)}&date=${today}`,
    );
  }

  let content =
    (lessonRes.data?.content_json as DailyLessonContent | null) ?? null;
  let status = lessonRes.data?.generation_status ?? "missing";
  let gospelAudioUrl: string | null = null;

  const band: AgeBandId | null =
    typeof selected.age === "number" ? ageBandFromAge(selected.age) : null;
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
    <>
      <header
        className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg-cream)]/95 backdrop-blur-md"
        style={{ paddingTop: "max(0.35rem, env(safe-area-inset-top))" }}
      >
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between gap-3 px-6">
          <BrandLogo href="/parent" size="sm" />
          <Link
            href="/parent"
            className="btn btn-secondary !px-3 !py-1.5 text-sm"
          >
            Atpakaļ
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 pt-5">
        <h1 className="brand-mark text-2xl text-[var(--bg-deep)]">
          Bērnu saturs
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Lasīšanai — bez bērna profila navigācijas un personīgajām lietām.
        </p>
        <div className="mt-4">
          <ParentContentPicker
            childrenList={childrenList}
            selectedId={selected.id}
            date={date}
          />
        </div>
      </div>

      <DailyLessonView
        date={date}
        dates={dates}
        displayName={selected.display_name}
        childId={selected.id}
        content={content}
        readings={readings}
        dailyQuote={dailyQuote}
        status={status}
        gospelAudioUrl={gospelAudioUrl}
        isParentContentReview
        splitOptionalReadings={
          typeof selected.age === "number" ? selected.age <= 12 : false
        }
      />
    </>
  );
}
