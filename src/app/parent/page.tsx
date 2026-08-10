import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ParentDashboard } from "@/components/ParentDashboard";
import { loadTeachingGoals } from "@/services/ai/generate";
import { generateFamilyCode } from "@/lib/codes";
import { todayInRiga } from "@/lib/dates";

export default async function ParentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?mode=parent");

  let { data: family } = await supabase
    .from("families")
    .select("id, name, family_code")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!family) {
    const familyName =
      (user.user_metadata?.family_name as string | undefined)?.trim() ||
      "Mana ģimene";
    for (let i = 0; i < 5 && !family; i++) {
      const { data, error } = await supabase
        .from("families")
        .insert({
          name: familyName,
          family_code: generateFamilyCode(),
          owner_user_id: user.id,
        })
        .select("id, name, family_code")
        .single();
      if (!error && data) family = data;
    }
  }

  if (!family) {
    redirect(
      "/login?mode=parent&error=" +
        encodeURIComponent("Neizdevās izveidot ģimeni."),
    );
  }

  const { data: children } = await supabase
    .from("children")
    .select("id, display_name, age, active, generated_profile")
    .eq("family_id", family.id)
    .order("display_name");

  const today = todayInRiga();
  const childIds = (children ?? []).map((c) => c.id);
  const lessonStatusByChild: Record<string, string> = {};
  if (childIds.length > 0) {
    const { data: lessons } = await supabase
      .from("daily_lessons")
      .select("child_id, generation_status")
      .eq("reading_date", today)
      .in("child_id", childIds);
    for (const lesson of lessons ?? []) {
      lessonStatusByChild[lesson.child_id] = lesson.generation_status;
    }
  }

  const goalsLib = loadTeachingGoals();
  const goals = goalsLib.goals.map((g) => ({
    id: g.id,
    name: g.name,
    category: g.category,
    category_id: g.category_id,
  }));
  const categories =
    goalsLib.categories?.map((c) => ({ id: c.id, name: c.name })) ??
    Array.from(
      new Map(goals.map((g) => [g.category, g.category])).entries(),
    ).map(([name]) => ({ id: name, name }));

  return (
    <ParentDashboard
      family={family}
      childrenList={(children ?? []).map((c) => ({
        id: c.id,
        display_name: c.display_name,
        age: c.age,
        active: c.active,
        hasProfile: Boolean(c.generated_profile),
        todayStatus: lessonStatusByChild[c.id] ?? "missing",
      }))}
      goals={goals}
      categories={categories}
    />
  );
}
