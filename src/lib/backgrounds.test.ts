import { describe, it, expect } from "vitest";
import { applyBackgrounds, BackgroundsFileSchema } from "./backgrounds.js";
import type { Question } from "./schemas.js";

const base: Question = {
  id: 1,
  category: "general",
  state: null,
  question: "Frage?",
  image: null,
  options: ["a", "b", "c", "d"],
  answerIndex: 0,
  explanation: "x",
};

describe("applyBackgrounds", () => {
  it("merges a background onto the matching question by questionKey", () => {
    const bg = { de: "Hintergrund", en: "Background" };
    const [out] = applyBackgrounds([base], { "general:1:": bg });
    expect(out.background).toEqual(bg);
  });

  it("distinguishes state questions that reuse ids across states", () => {
    const bayern: Question = { ...base, category: "state", state: "Bayern" };
    const hessen: Question = { ...base, category: "state", state: "Hessen" };
    const [b, h] = applyBackgrounds([bayern, hessen], {
      "state:1:Bayern": { de: "B", en: "B" },
    });
    expect(b.background?.de).toBe("B");
    expect(h.background).toBeUndefined();
  });

  it("leaves questions without an entry unchanged", () => {
    const [out] = applyBackgrounds([base], {});
    expect(out.background).toBeUndefined();
    expect(out).toBe(base);
  });

  it("rejects an entry missing a language", () => {
    expect(() => BackgroundsFileSchema.parse({ "general:1:": { de: "only de" } })).toThrow();
  });
});
