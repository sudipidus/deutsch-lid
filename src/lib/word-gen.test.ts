import { describe, it, expect } from "vitest";
import { buildWordPrompt, assembleWordsFile, type RawWordGen } from "./word-gen.js";

const gen = (over: Partial<RawWordGen>): RawWordGen => ({
  lemma: "Bundesland",
  pos: "noun",
  article: "das",
  meaning: "federal state",
  etymology: "Bund + Land",
  context: "Germany has 16.",
  ...over,
});

describe("buildWordPrompt", () => {
  it("includes the surface form and its sentence", () => {
    const p = buildWordPrompt({ surface: "Bundesländer", sentence: "Es gibt 16 Bundesländer." });
    expect(p).toContain("Bundesländer");
    expect(p).toContain("Es gibt 16 Bundesländer.");
  });
});

describe("assembleWordsFile", () => {
  it("keys entries by lemma and maps surface aliases", () => {
    const wf = assembleWordsFile([
      { surface: "Bundesländer", gen: gen({ lemma: "Bundesland" }) },
      { surface: "Bundesland", gen: gen({ lemma: "Bundesland" }) },
    ]);
    expect(Object.keys(wf.entries)).toEqual(["Bundesland"]);
    expect(wf.aliases["bundesländer"]).toBe("Bundesland");
    expect(wf.aliases["bundesland"]).toBe("Bundesland");
  });
});
