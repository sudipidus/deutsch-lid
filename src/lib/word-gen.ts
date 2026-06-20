import { z } from "zod";
import { normalizeWord } from "./tokenizer.js";
import type { WordsFile } from "./schemas.js";
import type { WordOccurrence } from "./collect-words.js";

export const RawWordGenSchema = z.object({
  lemma: z.string(),
  pos: z.string(),
  article: z.string().nullable(),
  meaning: z.string(),
  etymology: z.string(),
  context: z.string(),
});
export type RawWordGen = z.infer<typeof RawWordGenSchema>;

export type GenerateWord = (occ: WordOccurrence) => Promise<RawWordGen>;

export function buildWordPrompt(occ: WordOccurrence): string {
  return [
    "You are a German lexicographer helping a learner study for the",
    '"Leben in Deutschland" test.',
    `Analyze the German word "${occ.surface}" as it appears in this sentence:`,
    `"${occ.sentence}"`,
    "Return: its dictionary base form (lemma); part of speech (pos);",
    'the definite article ("der"/"die"/"das") if it is a noun, otherwise null;',
    "a concise English meaning; a short etymology; and one sentence of context",
    "explaining how the word is used or why it matters in this question.",
  ].join(" ");
}

export function assembleWordsFile(
  pairs: Array<{ surface: string; gen: RawWordGen }>,
): WordsFile {
  const entries: WordsFile["entries"] = {};
  const aliases: WordsFile["aliases"] = {};
  for (const { surface, gen } of pairs) {
    entries[gen.lemma] = {
      pos: gen.pos,
      article: gen.article,
      meaning: gen.meaning,
      etymology: gen.etymology,
      context: gen.context,
    };
    aliases[normalizeWord(surface)] = gen.lemma;
  }
  return { aliases, entries };
}
