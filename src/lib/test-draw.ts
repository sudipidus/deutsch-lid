import type { Question } from "./schemas.js";
import { questionKey } from "./data.js";

export const PASS_THRESHOLD = 17;
export const TEST_SIZE = 33;
const GENERAL_COUNT = 30;
const STATE_COUNT = 3;

function sample<T>(items: T[], n: number, rand: () => number): T[] {
  const pool = [...items];
  // Fisher-Yates partial shuffle
  for (let i = 0; i < n && i < pool.length; i++) {
    const j = i + Math.floor(rand() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

export function drawTest(all: Question[], state: string, rand: () => number = Math.random): Question[] {
  const general = all.filter((q) => q.category === "general");
  const stateQs = all.filter((q) => q.category === "state" && q.state === state);
  if (general.length < GENERAL_COUNT || stateQs.length < STATE_COUNT) {
    throw new Error(`Not enough questions to draw a test for ${state}`);
  }
  const drawn = [...sample(general, GENERAL_COUNT, rand), ...sample(stateQs, STATE_COUNT, rand)];
  // Fully shuffle so state questions aren't always last — better for learning.
  return sample(drawn, drawn.length, rand);
}

// Return a copy of the question with its A/B/C/D options in random order and
// answerIndex (plus any English translations) remapped to match. Practice-only:
// the official Test keeps the real exam's fixed option order.
export function shuffleOptions(q: Question, rand: () => number = Math.random): Question {
  const order = sample(
    q.options.map((_, i) => i),
    q.options.length,
    rand,
  );
  return {
    ...q,
    options: order.map((i) => q.options[i]),
    answerIndex: order.indexOf(q.answerIndex),
    translationEn: q.translationEn
      ? { ...q.translationEn, options: order.map((i) => q.translationEn!.options[i]) }
      : q.translationEn,
  };
}

export function scoreTest(
  drawn: Question[],
  answers: Record<string, number>,
): { correct: number; total: number; passed: boolean } {
  const correct = drawn.reduce((n, q) => n + (answers[questionKey(q)] === q.answerIndex ? 1 : 0), 0);
  return { correct, total: drawn.length, passed: correct >= PASS_THRESHOLD };
}
