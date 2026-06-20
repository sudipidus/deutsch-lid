import { describe, it, expect } from "vitest";
import { QuestionSchema, WordsFileSchema } from "./schemas.js";

describe("QuestionSchema", () => {
  const valid = {
    id: 1,
    category: "general",
    state: null,
    question: "Was ist das?",
    image: null,
    options: ["a", "b", "c", "d"],
    answerIndex: 2,
    explanation: "Because.",
  };

  it("accepts a valid question", () => {
    expect(() => QuestionSchema.parse(valid)).not.toThrow();
  });

  it("rejects answerIndex out of range", () => {
    expect(() => QuestionSchema.parse({ ...valid, answerIndex: 4 })).toThrow();
  });

  it("rejects options of the wrong length", () => {
    expect(() =>
      QuestionSchema.parse({ ...valid, options: ["a", "b", "c"] }),
    ).toThrow();
  });
});

describe("WordsFileSchema", () => {
  it("accepts a valid words file", () => {
    const wf = {
      aliases: { bundesländer: "Bundesland" },
      entries: {
        Bundesland: {
          pos: "noun",
          article: "das",
          meaning: "federal state",
          etymology: "Bund + Land",
          context: "Germany has 16.",
        },
      },
    };
    expect(() => WordsFileSchema.parse(wf)).not.toThrow();
  });
});
