export const AGE_BANDS = [
  {
    id: "age_7_9",
    label: "7–9 gadi",
  },
  {
    id: "age_10_12",
    label: "10–12 gadi",
  },
  {
    id: "age_13_15",
    label: "13–15 gadi",
  },
  {
    id: "age_16_19",
    label: "16–19 gadi",
  },
] as const;

export type AgeBandId = (typeof AGE_BANDS)[number]["id"];

export const AGE_BAND_COOKIE = "augt_age_band";
export const AGE_BAND_STORAGE_KEY = "augt:age_band";

export function isAgeBandId(value: string | null | undefined): value is AgeBandId {
  return AGE_BANDS.some((b) => b.id === value);
}

export function getAgeBand(id: AgeBandId) {
  return AGE_BANDS.find((b) => b.id === id)!;
}

/** Synthetic child id for local progress keys (not a DB uuid). */
export function guestChildId(band: AgeBandId): string {
  return `guest:${band}`;
}

export function parseGuestChildId(
  childId: string,
): AgeBandId | null {
  if (!childId.startsWith("guest:")) return null;
  const id = childId.slice("guest:".length);
  return isAgeBandId(id) ? id : null;
}

export function approximateAge(band: AgeBandId): number {
  switch (band) {
    case "age_7_9":
      return 8;
    case "age_10_12":
      return 11;
    case "age_13_15":
      return 14;
    case "age_16_19":
      return 17;
  }
}

/** Map a child's age to the public age-band lesson bucket. */
export function ageBandFromAge(age: number): AgeBandId {
  if (age <= 9) return "age_7_9";
  if (age <= 12) return "age_10_12";
  if (age <= 15) return "age_13_15";
  return "age_16_19";
}
