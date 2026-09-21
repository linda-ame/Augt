import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hashPersonalCode } from "@/lib/personal-code";
import {
  normalizeParentNotes,
  parentNotesHaveContent,
} from "@/lib/parent-notes";
import { getOwnedFamily } from "@/lib/family";
import { approveChildProfile, draftChildProfile } from "@/services/generation";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nepieciešama autentifikācija." }, { status: 401 });
  }

  const body = (await req.json()) as {
    displayName?: string;
    age?: number;
    personalCode?: string;
    parentNotes?: unknown;
    /** Pre-generated / edited profile text from the add form. */
    profileText?: string;
    /** Approve profile and generate today's lesson (default: true if profileText). */
    approveProfile?: boolean;
  };

  const displayName = body.displayName?.trim();
  const age = Number(body.age);
  const personalCode = body.personalCode?.trim();
  const parentNotes = normalizeParentNotes(body.parentNotes);
  const profileText = body.profileText?.trim() || "";
  const approveProfile =
    body.approveProfile !== undefined
      ? Boolean(body.approveProfile)
      : Boolean(profileText);

  if (!displayName || !personalCode || !age || age < 3 || age > 20) {
    return NextResponse.json({ error: "Nepilnīgi bērna dati." }, { status: 400 });
  }

  const family = await getOwnedFamily(supabase, user.id);
  if (!family) {
    return NextResponse.json({ error: "Vispirms izveido ģimeni." }, { status: 400 });
  }

  const personal_code_hash = await hashPersonalCode(personalCode);
  const { data: child, error } = await supabase
    .from("children")
    .insert({
      family_id: family.id,
      display_name: displayName,
      age,
      personal_code_hash,
      selected_goal_ids: [],
      parent_notes: parentNotes,
      notes_version: parentNotesHaveContent(parentNotes) ? 1 : 0,
      profile_status: profileText ? "draft" : "none",
      profile_draft: profileText || null,
    })
    .select("*")
    .single();

  if (error || !child) {
    return NextResponse.json(
      { error: error?.message || "Neizdevās pievienot bērnu." },
      { status: 500 },
    );
  }

  let resultChild = child;
  let draftError: string | null = null;

  // Legacy path: notes present but no preview text → generate draft server-side.
  if (!profileText && parentNotesHaveContent(parentNotes)) {
    try {
      resultChild = await draftChildProfile(child.id, parentNotes);
    } catch (err) {
      draftError = err instanceof Error ? err.message : String(err);
    }
  }

  if (profileText && approveProfile) {
    try {
      const approved = await approveChildProfile(child.id, {
        profileText,
        generateToday: true,
      });
      resultChild = approved.child;
    } catch (err) {
      draftError = err instanceof Error ? err.message : String(err);
    }
  }

  return NextResponse.json({
    child: resultChild,
    profileDraft: resultChild.profile_draft ?? null,
    draftError,
    approved: resultChild.profile_status === "approved",
  });
}
