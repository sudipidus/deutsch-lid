import { describe, it, expect } from "vitest";
import { resolveWord, questionKey } from "./data.js";
import type { WordsFile } from "./schemas.js";

const wf: WordsFile = {
  aliases: { bundesländer: "Bundesland", bundesland: "Bundesland" },
  entries: {
    Bundesland: { pos: "noun", article: "das", meaning: "federal state", etymology: "Bund+Land", context: "16 of them." },
  },
};

describe("resolveWord", () => {
  it("resolves an inflected surface form to its lemma entry", () => {
    const r = resolveWord(wf, "Bundesländer");
    expect(r?.lemma).toBe("Bundesland");
    expect(r?.entry.article).toBe("das");
  });
  it("is case-insensitive via normalizeWord", () => {
    expect(resolveWord(wf, "BUNDESLAND")?.lemma).toBe("Bundesland");
  });
  it("returns null for unknown words", () => {
    expect(resolveWord(wf, "xyz")).toBeNull();
  });
});

describe("questionKey", () => {
  it("builds a stable composite key", () => {
    expect(questionKey({ id: 7, category: "state", state: "Bayern" })).toBe("state:7:Bayern");
    expect(questionKey({ id: 3, category: "general", state: null })).toBe("general:3:");
  });
});
