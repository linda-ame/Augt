import {
  ageBandFromAge,
  type AgeBandId,
} from "@/lib/age-bands";
import type { ConfessionVersionId } from "@/lib/confession-versions";

/** Visual intensity for kid UI — Augt brand, age-tuned. */
export type VisualTone = "vivid" | "soft" | "calm";

export function visualToneFromAgeBand(band: AgeBandId): VisualTone {
  switch (band) {
    case "age_7_9":
      return "vivid";
    case "age_10_12":
      return "soft";
    case "age_13_15":
    case "age_16_19":
      return "calm";
  }
}

export function visualToneFromAge(age: number): VisualTone {
  return visualToneFromAgeBand(ageBandFromAge(age));
}

/** Confession version → same tone scale as daily age bands. */
export function visualToneFromConfessionVersion(
  versionId: ConfessionVersionId,
): VisualTone {
  switch (versionId) {
    case "children":
      return "vivid";
    case "teens-12-14":
      return "soft";
    case "teens-15-18":
      return "calm";
  }
}

export function kidShellToneClass(tone: VisualTone): string {
  return `kid-shell--${tone}`;
}

export function confessionToneClass(tone: VisualTone): string {
  return `confession-app--${tone}`;
}
