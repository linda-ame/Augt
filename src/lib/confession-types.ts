export type ConfessionQuestion = {
  id: string;
  text: string;
};

export type ConfessionCommandment = {
  id: string;
  title: string;
  questions: ConfessionQuestion[];
};

export type ConfessionContent = {
  intro: {
    id: string;
    title: string;
    text: string[];
  };
  preparation_prayer: {
    id: string;
    title: string;
    text: string[];
    prayer: {
      id: string;
      title: string;
      text: string[];
    };
  };
  commandments: ConfessionCommandment[];
  after_examination_prayer: {
    id: string;
    title: string;
    text: string[];
  };
};

export type ConfessionAppData = {
  meta: {
    type: string;
    version: string;
    language: string;
  };
  content: ConfessionContent;
};

export type ConfessionPdfStep =
  | {
      id: string;
      type: "text" | "dialogue" | "priest_absolution" | "penance" | "prayer" | "prayers";
      title: string;
      text: string[];
    }
  | {
      id: string;
      type: "conditional";
      title: string;
      cases: {
        first_confession: string[];
        not_first_confession: string[];
      };
    }
  | {
      id: string;
      type: "dynamic_sins";
      title: string;
      intro: string;
      source: string;
    };

export type ConfessionPdfData = {
  meta: {
    type: string;
    version: string;
    language: string;
  };
  content: {
    steps: ConfessionPdfStep[];
  };
};

export type CustomSin = {
  id: string;
  text: string;
};

export type ConfessionStep = "intro" | "prayer" | "questions";

export type ConfessionState = {
  firstConfession: boolean;
  saveDuration: number;
  answers: Record<string, boolean>;
  notes: Record<string, string>;
  customSins: CustomSin[];
  step: ConfessionStep;
  updatedAt: number;
};

export const STORAGE_KEY = "augt-confession";

export function createEmptyConfessionState(): ConfessionState {
  return {
    firstConfession: false,
    saveDuration: 0,
    answers: {},
    notes: {},
    customSins: [],
    step: "intro",
    updatedAt: Date.now(),
  };
}
