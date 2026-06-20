import { describe, it, expect } from "vitest";
import { buildExplanationPrompt } from "./explanation-prompt.js";
import type { Question } from "./schemas.js";

const q: Question = {
  id: 1,
  category: "general",
  state: null,
  question: "Was ist die Hauptstadt Deutschlands?",
  image: null,
  options: ["Berlin", "München", "Hamburg", "Köln"],
  answerIndex: 0,
  explanation: "",
};

describe("buildExplanationPrompt", () => {
  it("includes the question and marks the correct option", () => {
    const p = buildExplanationPrompt(q);
    expect(p).toContain("Was ist die Hauptstadt Deutschlands?");
    expect(p).toContain("Berlin");
    expect(p.toLowerCase()).toContain("correct");
  });
});
