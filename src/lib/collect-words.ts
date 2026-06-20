import { extractWords, normalizeWord } from "./tokenizer.js";
import type { Question } from "./schemas.js";

export interface WordOccurrence {
  surface: string;
  sentence: string;
}

export function collectWords(questions: Question[]): WordOccurrence[] {
  const seen = new Map<string, WordOccurrence>();
  const consider = (text: string) => {
    for (const surface of extractWords(text)) {
      const key = normalizeWord(surface);
      if (!seen.has(key)) seen.set(key, { surface, sentence: text });
    }
  };
  for (const q of questions) {
    consider(q.question);
    for (const opt of q.options) consider(opt);
  }
  return [...seen.values()];
}
