import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { QuestionsSchema } from "../src/lib/schemas.js";
import { applyBackgrounds, BackgroundsFileSchema } from "../src/lib/backgrounds.js";

// Merge data/backgrounds.json into data/questions.json. Idempotent: re-running
// it simply re-applies the current backgrounds. Validates the result so a
// malformed entry fails loudly instead of shipping.
const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, "..", "data");

async function main() {
  const questions = QuestionsSchema.parse(
    JSON.parse(await readFile(join(dataDir, "questions.json"), "utf8")),
  );
  const backgrounds = BackgroundsFileSchema.parse(
    JSON.parse(await readFile(join(dataDir, "backgrounds.json"), "utf8")),
  );

  const keys = new Set(
    questions.map((q) => `${q.category}:${q.id}:${q.state ?? ""}`),
  );
  const unknown = Object.keys(backgrounds).filter((k) => !keys.has(k));
  if (unknown.length > 0) {
    console.error(`backgrounds.json has ${unknown.length} keys with no matching question:`);
    console.error(unknown.slice(0, 20).join(", "));
    process.exit(1);
  }

  const merged = QuestionsSchema.parse(applyBackgrounds(questions, backgrounds));
  const withBg = merged.filter((q) => q.background).length;
  await writeFile(join(dataDir, "questions.json"), JSON.stringify(merged, null, 2) + "\n");
  console.log(`Applied backgrounds to ${withBg}/${merged.length} questions.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
