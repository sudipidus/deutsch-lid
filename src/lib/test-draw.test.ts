import { describe, it, expect } from "vitest";
import { drawTest, scoreTest, shuffleOptions, PASS_THRESHOLD, TEST_SIZE } from "./test-draw.js";
import { questionKey } from "./data.js";
import type { Question } from "./schemas.js";

const mk = (id: number, category: "general" | "state", state: string | null, answerIndex: number): Question => ({
  id, category, state, question: `Q${id}`, image: null, options: ["a", "b", "c", "d"], answerIndex, explanation: "",
});

const all: Question[] = [
  ...Array.from({ length: 40 }, (_, i) => mk(i + 1, "general", null, 0)),
  ...Array.from({ length: 10 }, (_, i) => mk(i + 1, "state", "Bayern", 1)),
  ...Array.from({ length: 10 }, (_, i) => mk(i + 1, "state", "Berlin", 2)),
];

describe("drawTest", () => {
  it("draws 30 general + 3 from the chosen state", () => {
    const drawn = drawTest(all, "Bayern", () => 0);
    expect(drawn).toHaveLength(TEST_SIZE);
    expect(drawn.filter((q) => q.category === "general")).toHaveLength(30);
    const stateQs = drawn.filter((q) => q.category === "state");
    expect(stateQs).toHaveLength(3);
    expect(stateQs.every((q) => q.state === "Bayern")).toBe(true);
  });
});

describe("shuffleOptions", () => {
  it("permutes options while answerIndex keeps pointing at the correct text", () => {
    const q = mk(1, "general", null, 2); // options ["a","b","c","d"], correct = "c"
    let seq = 0;
    const rand = () => [0.9, 0.1, 0.8][seq++ % 3]; // non-trivial permutation
    const shuffled = shuffleOptions(q, rand);
    expect([...shuffled.options].sort()).toEqual(["a", "b", "c", "d"]); // same set
    expect(shuffled.options[shuffled.answerIndex]).toBe("c"); // correct text preserved
  });
});

describe("scoreTest", () => {
  it("counts correct answers and applies the 17 threshold", () => {
    const drawn = drawTest(all, "Bayern", () => 0);
    const answers: Record<string, number> = {};
    drawn.forEach((q, i) => { answers[questionKey(q)] = i < 17 ? q.answerIndex : (q.answerIndex + 1) % 4; });
    const res = scoreTest(drawn, answers);
    expect(res.correct).toBe(17);
    expect(res.total).toBe(33);
    expect(res.passed).toBe(true);
  });
  it("fails below threshold", () => {
    const drawn = drawTest(all, "Bayern", () => 0);
    expect(scoreTest(drawn, {}).passed).toBe(false);
  });
});
