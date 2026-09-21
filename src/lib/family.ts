import type { SupabaseClient } from "@supabase/supabase-js";
import { generateFamilyCode } from "@/lib/codes";

export type FamilyRow = {
  id: string;
  name: string;
  family_code: string;
  parent_gate_pin_hash: string | null;
};

/** Prefer the oldest family for an owner (avoids empty duplicates from failed lookups). */
export async function getOwnedFamily(
  supabase: SupabaseClient,
  ownerUserId: string,
): Promise<FamilyRow | null> {
  const { data, error } = await supabase
    .from("families")
    .select("id, name, family_code, parent_gate_pin_hash")
    .eq("owner_user_id", ownerUserId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getOwnedFamily", error.message);
    return null;
  }
  return data;
}

export async function ensureOwnedFamily(
  supabase: SupabaseClient,
  ownerUserId: string,
  familyName = "Mana ģimene",
): Promise<FamilyRow | null> {
  const existing = await getOwnedFamily(supabase, ownerUserId);
  if (existing) return existing;

  for (let i = 0; i < 5; i++) {
    const { data, error } = await supabase
      .from("families")
      .insert({
        name: familyName,
        family_code: generateFamilyCode(),
        owner_user_id: ownerUserId,
      })
      .select("id, name, family_code, parent_gate_pin_hash")
      .single();
    if (!error && data) return data;

    // Race: another request created a family — re-read.
    const again = await getOwnedFamily(supabase, ownerUserId);
    if (again) return again;
  }

  return null;
}
