import type { Question } from "./schemas.js";

export interface RawQuestion {
  id: number | string;
  category?: string;
  state?: string | null;
  question: string;
  image?: string | null;
  options: string[];
  answerIndex?: number;
  answer?: string;
}

export function normalizeQuestion(raw: RawQuestion): Question {
  if (raw.options.length !== 4) {
    throw new Error(`Question ${raw.id} must have 4 options, got ${raw.options.length}`);
  }
  let answerIndex = raw.answerIndex;
  if (answerIndex === undefined && raw.answer !== undefined) {
    answerIndex = raw.options.indexOf(raw.answer);
  }
  if (answerIndex === undefined || answerIndex < 0 || answerIndex > 3) {
    throw new Error(`Question ${raw.id}: could not resolve a 0-3 answer index`);
  }
  const category = raw.category === "state" ? "state" : "general";
  return {
    id: typeof raw.id === "string" ? Number(raw.id) : raw.id,
    category,
    state: raw.state ?? null,
    question: raw.question,
    image: raw.image ?? null,
    options: raw.options,
    answerIndex,
    explanation: "",
  };
}
