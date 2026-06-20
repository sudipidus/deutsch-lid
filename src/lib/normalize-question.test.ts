import { describe, it, expect } from "vitest";
import { normalizeQuestion } from "./normalize-question.js";

describe("normalizeQuestion", () => {
  it("resolves answerIndex from an answer string", () => {
    const q = normalizeQuestion({
      id: "5",
      question: "Frage?",
      options: ["w", "x", "y", "z"],
      answer: "y",
    });
    expect(q.id).toBe(5);
    expect(q.answerIndex).toBe(2);
    expect(q.category).toBe("general");
    expect(q.state).toBeNull();
    expect(q.explanation).toBe("");
  });

  it("keeps an explicit answerIndex", () => {
    const q = normalizeQuestion({
      id: 1,
      question: "Frage?",
      options: ["w", "x", "y", "z"],
      answerIndex: 0,
    });
    expect(q.answerIndex).toBe(0);
  });

  it("throws when the answer cannot be resolved", () => {
    expect(() =>
      normalizeQuestion({
        id: 1,
        question: "Frage?",
        options: ["w", "x", "y", "z"],
        answer: "nope",
      }),
    ).toThrow();
  });

  it("throws when options length is not 4", () => {
    expect(() =>
      normalizeQuestion({ id: 1, question: "Q", options: ["a", "b"], answerIndex: 0 }),
    ).toThrow();
  });
});
