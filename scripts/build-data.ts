import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { QuestionsSchema, WordsFileSchema } from "../src/lib/schemas.js";
import { extractWords, normalizeWord } from "../src/lib/tokenizer.js";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, "..", "data");

async function main() {
  const questions = QuestionsSchema.parse(
    JSON.parse(await readFile(join(dataDir, "questions.json"), "utf8")),
  );
  const words = WordsFileSchema.parse(
    JSON.parse(await readFile(join(dataDir, "words.json"), "utf8")),
  );

  const missing = new Set<string>();
  for (const q of questions) {
    for (const text of [q.question, ...q.options]) {
      for (const surface of extractWords(text)) {
        if (!words.aliases[normalizeWord(surface)]) missing.add(surface);
      }
    }
  }
  if (missing.size > 0) {
    console.error(`Missing word entries for ${missing.size} surface forms:`);
    console.error([...missing].slice(0, 50).join(", "));
    process.exit(1);
  }
  console.log(
    `OK: ${questions.length} questions, ${Object.keys(words.entries).length} lemma entries, all words resolve.`,
  );
}

main();
