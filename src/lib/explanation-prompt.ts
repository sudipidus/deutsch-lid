import type { Question } from "./schemas.js";

export function buildExplanationPrompt(q: Question): string {
  const optionLines = q.options
    .map((opt, i) => `${i === q.answerIndex ? "[correct]" : "         "} ${opt}`)
    .join("\n");
  return [
    'You are helping a learner study for the German "Leben in Deutschland" test.',
    "For the following multiple-choice question, write a short explanation (2-4 sentences)",
    "of why the correct answer is right, including the relevant civic or cultural background.",
    "Write in clear English.",
    "",
    `Question: ${q.question}`,
    "Options:",
    optionLines,
  ].join("\n");
}
