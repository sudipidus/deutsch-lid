import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { z } from "zod";
import { QuestionSchema, WordsFileSchema } from "../src/lib/schemas.js";
import { collectWords } from "../src/lib/collect-words.js";
import { runWithManifest } from "../src/lib/run-with-manifest.js";
import { assembleWordsFile, type RawWordGen } from "../src/lib/word-gen.js";
import { makeClient, createWordGenerator } from "../src/lib/anthropic.js";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, "..", "data");
const BaseQuestionSchema = QuestionSchema.omit({ explanation: true });

async function main() {
  const questions = z
    .array(BaseQuestionSchema)
    .parse(JSON.parse(await readFile(join(dataDir, "raw", "questions.base.json"), "utf8")))
    .map((q) => ({ ...q, explanation: "" }));

  const occurrences = collectWords(questions);
  console.log(`Generating entries for ${occurrences.length} unique words`);

  const generate = createWordGenerator(makeClient());
  const results = await runWithManifest<(typeof occurrences)[number], RawWordGen>({
    items: occurrences,
    keyOf: (occ) => occ.surface,
    manifestPath: join(dataDir, "raw", "words.manifest.jsonl"),
    run: (occ) => generate(occ),
  });

  const wordsFile = assembleWordsFile(
    results.map((r, i) => ({ surface: occurrences[i].surface, gen: r.result })),
  );
  WordsFileSchema.parse(wordsFile);
  await writeFile(join(dataDir, "words.json"), JSON.stringify(wordsFile, null, 2));
  console.log(`Wrote ${Object.keys(wordsFile.entries).length} lemma entries`);
}

main().catch((e) => { console.error(e); process.exit(1); });
