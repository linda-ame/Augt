export type ParentNotes = {
  emphasize: string;
  challenges: string;
  boundaries: string;
  other: string;
};

export type ProfileStatus = "none" | "draft" | "approved";

export const EMPTY_PARENT_NOTES: ParentNotes = {
  emphasize: "",
  challenges: "",
  boundaries: "",
  other: "",
};

export function normalizeParentNotes(input: unknown): ParentNotes {
  const raw =
    input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  return {
    emphasize: typeof raw.emphasize === "string" ? raw.emphasize.trim() : "",
    challenges: typeof raw.challenges === "string" ? raw.challenges.trim() : "",
    boundaries: typeof raw.boundaries === "string" ? raw.boundaries.trim() : "",
    other: typeof raw.other === "string" ? raw.other.trim() : "",
  };
}

export function parentNotesHaveContent(notes: ParentNotes): boolean {
  return Boolean(
    notes.emphasize || notes.challenges || notes.boundaries || notes.other,
  );
}
