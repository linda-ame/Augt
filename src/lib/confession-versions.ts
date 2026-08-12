import childrenApp from "@/data/confession/children/sirdsapzinas-izmeklesana.json";
import childrenPdf from "@/data/confession/children/greksudze.json";
import teens1214App from "@/data/confession/teens/12-14/sirdsapzinas-izmeklesana.json";
import teens1214Pdf from "@/data/confession/teens/12-14/greksudze.json";
import teens1518App from "@/data/confession/teens/15-18/sirdsapzinas-izmeklesana.json";
import teens1518Pdf from "@/data/confession/teens/15-18/greksudze.json";
import type {
  ConfessionAppData,
  ConfessionPdfData,
} from "@/lib/confession-types";

export const CONFESSION_VERSION_IDS = [
  "children",
  "teens-12-14",
  "teens-15-18",
] as const;

export type ConfessionVersionId = (typeof CONFESSION_VERSION_IDS)[number];

export type ConfessionVersion = {
  id: ConfessionVersionId;
  title: string;
  subtitle: string;
  storageKey: string;
  /** Legacy key to migrate from (children only). */
  legacyStorageKey?: string;
  appData: ConfessionAppData;
  pdfData: ConfessionPdfData;
  questionsHeading: string;
};

export const CONFESSION_VERSIONS: ConfessionVersion[] = [
  {
    id: "children",
    title: "Jaunākie bērni",
    subtitle: "Līdz apmēram 11 gadiem",
    storageKey: "augt-confession-children",
    legacyStorageKey: "augt-confession",
    appData: childrenApp as ConfessionAppData,
    pdfData: childrenPdf as ConfessionPdfData,
    questionsHeading: "Vai tas attiecas uz mani?",
  },
  {
    id: "teens-12-14",
    title: "12–14 gadi",
    subtitle: "Sirdsapziņas izmeklēšana jaunākiem pusaudžiem",
    storageKey: "augt-confession-teens-12-14",
    appData: teens1214App as ConfessionAppData,
    pdfData: teens1214Pdf as ConfessionPdfData,
    questionsHeading: "Kas attiecas uz mani?",
  },
  {
    id: "teens-15-18",
    title: "15–18 gadi",
    subtitle: "Sirdsapziņas izmeklēšana vecākiem pusaudžiem",
    storageKey: "augt-confession-teens-15-18",
    appData: teens1518App as ConfessionAppData,
    pdfData: teens1518Pdf as ConfessionPdfData,
    questionsHeading: "Kas attiecas uz mani?",
  },
];

export function isConfessionVersionId(
  value: string | null | undefined,
): value is ConfessionVersionId {
  return CONFESSION_VERSION_IDS.some((id) => id === value);
}

export function getConfessionVersion(id: ConfessionVersionId): ConfessionVersion {
  return CONFESSION_VERSIONS.find((v) => v.id === id)!;
}
