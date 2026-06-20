import { z } from "zod";

export const QuestionSchema = z.object({
  id: z.number().int(),
  category: z.enum(["general", "state"]),
  state: z.string().nullable(),
  question: z.string().min(1),
  image: z.string().nullable(),
  options: z.array(z.string().min(1)).length(4),
  answerIndex: z.number().int().min(0).max(3),
  explanation: z.string(),
});
export type Question = z.infer<typeof QuestionSchema>;

export const QuestionsSchema = z.array(QuestionSchema);
export type Questions = z.infer<typeof QuestionsSchema>;

export const WordEntrySchema = z.object({
  pos: z.string(),
  article: z.string().nullable(),
  meaning: z.string(),
  etymology: z.string(),
  context: z.string(),
});
export type WordEntry = z.infer<typeof WordEntrySchema>;

export const WordsFileSchema = z.object({
  aliases: z.record(z.string(), z.string()),
  entries: z.record(z.string(), WordEntrySchema),
});
export type WordsFile = z.infer<typeof WordsFileSchema>;
