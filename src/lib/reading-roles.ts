import type { ReadingRole, ScriptureReading } from "@/lib/types";

/** Assign roles to older stored readings that lack `role`. */
export function ensureReadingRoles(
  readings: ScriptureReading[],
): ScriptureReading[] {
  if (!readings.length) return readings;
  if (readings.every((r) => r.role)) return readings;

  const classified = readings.map((r, index, arr) => {
    if (r.role) return r;
    const blob = `${r.label} ${r.reference}`.toLowerCase();
    let role: ReadingRole;
    if (/evaņģēlij|evangelij|jņ|jn |mt |mk |lk /i.test(blob)) {
      role = "gospel";
    } else if (/psalm|ps\s*\d/i.test(blob)) {
      role = "psalm";
    } else if (/allelu|alēluj/i.test(blob)) {
      role = "alleluia";
    } else if (index === arr.length - 1) {
      role = "gospel";
    } else if (index === 0) {
      role = "first_reading";
    } else {
      role = "second_reading";
    }
    return { ...r, role };
  });

  // If multiple unmarked readings and last is gospel, first is first_reading
  const hasGospel = classified.some((r) => r.role === "gospel");
  if (!hasGospel && classified.length > 0) {
    classified[classified.length - 1] = {
      ...classified[classified.length - 1],
      role: "gospel",
    };
  }
  return classified;
}
