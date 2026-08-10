import type { LessonTabId } from "@/lib/types";

export type DayProgress = {
  visited: LessonTabId[];
  morningDone: boolean;
};

function storageKey(childId: string, date: string) {
  return `augt:day-progress:${childId}:${date}`;
}

export function loadDayProgress(childId: string, date: string): DayProgress {
  if (typeof window === "undefined") {
    return { visited: [], morningDone: false };
  }
  try {
    const raw = localStorage.getItem(storageKey(childId, date));
    if (!raw) return { visited: [], morningDone: false };
    const parsed = JSON.parse(raw) as Partial<DayProgress>;
    return {
      visited: Array.isArray(parsed.visited)
        ? (parsed.visited as LessonTabId[])
        : [],
      morningDone: Boolean(parsed.morningDone),
    };
  } catch {
    return { visited: [], morningDone: false };
  }
}

export function saveDayProgress(
  childId: string,
  date: string,
  progress: DayProgress,
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(childId, date), JSON.stringify(progress));
}

export function markTabVisited(
  childId: string,
  date: string,
  tab: LessonTabId,
): DayProgress {
  const current = loadDayProgress(childId, date);
  if (!current.visited.includes(tab)) {
    current.visited = [...current.visited, tab];
  }
  saveDayProgress(childId, date, current);
  return current;
}

export function markMorningDone(childId: string, date: string): DayProgress {
  const current = loadDayProgress(childId, date);
  current.morningDone = true;
  if (!current.visited.includes("morning")) {
    current.visited = [...current.visited, "morning"];
  }
  if (!current.visited.includes("gospel")) {
    current.visited = [...current.visited, "gospel"];
  }
  saveDayProgress(childId, date, current);
  return current;
}
