import { describe, it, expect } from "vitest";
import { tokenize, normalizeWord, extractWords } from "./tokenizer.js";

describe("tokenize", () => {
  it("splits words from punctuation and whitespace, lossless", () => {
    const text = "Was ist das Grundgesetz?";
    const tokens = tokenize(text);
    expect(tokens.map((t) => t.text).join("")).toBe(text);
    expect(tokens.filter((t) => t.isWord).map((t) => t.text)).toEqual([
      "Was",
      "ist",
      "das",
      "Grundgesetz",
    ]);
  });

  it("treats umlauts and ß as word characters", () => {
    expect(extractWords("Bundesländer groß")).toEqual(["Bundesländer", "groß"]);
  });

  it("splits hyphenated and slashed compounds on the separator", () => {
    expect(extractWords("EU-Bürger und/oder")).toEqual([
      "EU",
      "Bürger",
      "und",
      "oder",
    ]);
  });
});

describe("normalizeWord", () => {
  it("lowercases", () => {
    expect(normalizeWord("Grundgesetz")).toBe("grundgesetz");
    expect(normalizeWord("Bundesländer")).toBe("bundesländer");
  });
});
