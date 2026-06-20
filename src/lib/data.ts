import questionsJson from "../../data/questions.json";
import wordsJson from "../../data/words.json";
import { normalizeWord } from "./tokenizer.js";
import type { Question, WordsFile, WordEntry } from "./schemas.js";

export const questions: Question[] = questionsJson as Question[];
export const words: WordsFile = wordsJson as WordsFile;

export function resolveWord(
  words: WordsFile,
  surface: string,
): { lemma: string; entry: WordEntry } | null {
  const lemma = words.aliases[normalizeWord(surface)];
  if (!lemma) return null;
  const entry = words.entries[lemma];
  return entry ? { lemma, entry } : null;
}

export function lookupWord(surface: string) {
  return resolveWord(words, surface);
}

export function questionKey(q: Pick<Question, "id" | "category" | "state">): string {
  return `${q.category}:${q.id}:${q.state ?? ""}`;
}

export function imageUrl(image: string): string {
  return `${import.meta.env.BASE_URL}${image}`;
}

export const STATES: string[] = [
  ...new Set(questions.filter((q) => q.category === "state" && q.state).map((q) => q.state as string)),
].sort((a, b) => a.localeCompare(b, "de"));

// Return a new array with the items in random order (Fisher-Yates). `rand` is
// injectable so tests are deterministic; the app passes the default Math.random
// so Study/Practice start somewhere different each session.
export function shuffle<T>(items: T[], rand: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
