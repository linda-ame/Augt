import dievs from "@/data/faith/dievs.json";
import bausli from "@/data/faith/bausli.json";
import sakramenti from "@/data/faith/sakramenti.json";
import type { CurriculumBook } from "@/lib/faith-types";

export const CURRICULUM_TOPICS: Record<
  string,
  { title: string; book: CurriculumBook }
> = {
  god: {
    title: "Dievs un ticība",
    book: dievs as unknown as CurriculumBook,
  },
  commandments: {
    title: "Baušļi",
    book: bausli as unknown as CurriculumBook,
  },
  sacraments: {
    title: "Sakramenti",
    book: sakramenti as unknown as CurriculumBook,
  },
};

export function getCurriculumTopic(topic: string) {
  return CURRICULUM_TOPICS[topic] ?? null;
}
