import { describe, it, expect } from "vitest";
import { collectWords } from "./collect-words.js";
import type { Question } from "./schemas.js";

const q = (over: Partial<Question>): Question => ({
  id: 1,
  category: "general",
  state: null,
  question: "Was ist das?",
  image: null,
  options: ["der Bund", "das Land", "die Stadt", "das Dorf"],
  answerIndex: 0,
  explanation: "",
  ...over,
});

describe("collectWords", () => {
  it("dedupes by normalized form across question and options", () => {
    const words = collectWords([q({ question: "Das ist das Land." })]);
    const surfaces = words.map((w) => w.surface);
    // "Das"/"das" collapse to one entry; "Land" appears once
    expect(surfaces.filter((s) => s.toLowerCase() === "das")).toHaveLength(1);
    expect(surfaces).toContain("Land");
  });

  it("attaches a sentence containing the word", () => {
    const words = collectWords([q({})]);
    const bund = words.find((w) => w.surface === "Bund");
    expect(bund?.sentence).toContain("Bund");
  });
});
