import { z } from "zod";
import type { Question } from "./schemas.js";
import { questionKey } from "./data.js";

// data/backgrounds.json is the durable, hand-authored source of the deeper
// "Hintergrund / Background" text. It is keyed by questionKey so it survives a
// full regeneration of questions.json (which `generate-explanations.ts` does),
// and merged back in by `apply-backgrounds.ts` and the explanation pipeline.
export const BackgroundSchema = z.object({ de: z.string().min(1), en: z.string().min(1) });
export const BackgroundsFileSchema = z.record(z.string(), BackgroundSchema);
export type BackgroundsFile = z.infer<typeof BackgroundsFileSchema>;

// Return a new list with each question's `background` set from `backgrounds`
// (by questionKey) when an entry exists; questions without an entry are
// returned unchanged. Pure so it can be unit-tested and reused by both the
// standalone apply step and the explanation pipeline.
export function applyBackgrounds(questions: Question[], backgrounds: BackgroundsFile): Question[] {
  return questions.map((q) => {
    const bg = backgrounds[questionKey(q)];
    return bg ? { ...q, background: bg } : q;
  });
}
