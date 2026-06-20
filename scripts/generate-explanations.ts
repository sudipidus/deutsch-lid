import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { z } from "zod";
import { QuestionSchema, QuestionsSchema, type Question } from "../src/lib/schemas.js";
import { runWithManifest } from "../src/lib/run-with-manifest.js";
import { buildExplanationPrompt } from "../src/lib/explanation-prompt.js";
import { makeClient, generateExplanation } from "../src/lib/anthropic.js";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, "..", "data");
const BaseQuestionSchema = QuestionSchema.omit({ explanation: true });

async function main() {
  const base: Question[] = z
    .array(BaseQuestionSchema)
    .parse(JSON.parse(await readFile(join(dataDir, "raw", "questions.base.json"), "utf8")))
    .map((q) => ({ ...q, explanation: "" }));

  const client = makeClient();
  const results = await runWithManifest<Question, string>({
    items: base,
    keyOf: (q) => String(q.id) + ":" + q.category + ":" + (q.state ?? ""),
    manifestPath: join(dataDir, "raw", "explanations.manifest.jsonl"),
    run: (q) => generateExplanation(client, buildExplanationPrompt(q)),
  });

  const byKey = new Map(results.map((r) => [r.key, r.result]));
  const final = base.map((q) => ({
    ...q,
    explanation: byKey.get(String(q.id) + ":" + q.category + ":" + (q.state ?? ""))!,
  }));
  QuestionsSchema.parse(final);
  await writeFile(join(dataDir, "questions.json"), JSON.stringify(final, null, 2));
  console.log(`Wrote ${final.length} questions with explanations`);
}

main().catch((e) => { console.error(e); process.exit(1); });
