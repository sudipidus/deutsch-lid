import { writeFile, mkdir, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { normalizeQuestion } from "../src/lib/normalize-question.js";
import { QuestionSchema } from "../src/lib/schemas.js";

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(here, "..");
const dataDir = join(projectRoot, "data");
const imagesDir = join(dataDir, "images");
const rawDir = join(dataDir, "raw");

const DATA_URL =
  "https://raw.githubusercontent.com/flexsurfer/einburgerungstest/main/app/mobile/assets/data.json";
const IMAGE_BASE_URL =
  "https://raw.githubusercontent.com/flexsurfer/einburgerungstest/main/app/mobile/assets/img/";

const BUNDESLAENDER = new Set([
  "Baden-Württemberg",
  "Bayern",
  "Berlin",
  "Brandenburg",
  "Bremen",
  "Hamburg",
  "Hessen",
  "Mecklenburg-Vorpommern",
  "Niedersachsen",
  "Nordrhein-Westfalen",
  "Rheinland-Pfalz",
  "Saarland",
  "Sachsen",
  "Sachsen-Anhalt",
  "Schleswig-Holstein",
  "Thüringen",
]);

interface SourceRecord {
  question: string;
  answers: string[];
  correct: number;
  category: string;
  img?: { url: string };
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function downloadImage(name: string): Promise<boolean> {
  const destPath = join(imagesDir, `${name}.png`);
  if (await fileExists(destPath)) {
    return false; // already present
  }
  const url = `${IMAGE_BASE_URL}${name}.png`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download image ${name}: HTTP ${res.status}`);
  }
  const buf = await res.arrayBuffer();
  await writeFile(destPath, Buffer.from(buf));
  return true; // newly downloaded
}

async function main() {
  // Fetch dataset
  console.log(`Fetching dataset from ${DATA_URL} ...`);
  const res = await fetch(DATA_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch dataset: HTTP ${res.status}`);
  }
  const sourceRecords: SourceRecord[] = await res.json();
  console.log(`Fetched ${sourceRecords.length} source records.`);

  // Ensure output dirs exist
  await mkdir(imagesDir, { recursive: true });
  await mkdir(rawDir, { recursive: true });

  // Track counters per bucket for sequential ids
  const generalCounter = { n: 0 };
  const stateCounters: Map<string, number> = new Map();

  const questions = [];
  const imageNames: string[] = [];
  let validationFailures = 0;

  for (const rec of sourceRecords) {
    const isState = BUNDESLAENDER.has(rec.category);

    let id: number;
    let category: string;
    let state: string | null;

    if (isState) {
      category = "state";
      state = rec.category;
      const prev = stateCounters.get(state) ?? 0;
      id = prev + 1;
      stateCounters.set(state, id);
    } else {
      category = "general";
      state = null;
      generalCounter.n += 1;
      id = generalCounter.n;
    }

    const imageField = rec.img?.url ? `images/${rec.img.url}.png` : null;
    if (rec.img?.url) {
      imageNames.push(rec.img.url);
    }

    const raw = {
      id,
      category,
      state,
      question: rec.question,
      image: imageField,
      options: rec.answers,
      answerIndex: rec.correct,
    };

    const normalized = normalizeQuestion(raw);

    // Validate with QuestionSchema minus explanation
    const baseSchema = QuestionSchema.omit({ explanation: true });
    const result = baseSchema.safeParse(normalized);
    if (!result.success) {
      console.error(
        `Validation failure for record id=${id} category=${category} state=${state}:`,
        result.error.format(),
      );
      validationFailures++;
    } else {
      questions.push(normalized);
    }
  }

  if (validationFailures > 0) {
    throw new Error(`${validationFailures} question(s) failed validation. Aborting.`);
  }

  // Download images
  let imagesDownloaded = 0;
  let imagesSkipped = 0;
  for (const name of imageNames) {
    const downloaded = await downloadImage(name);
    if (downloaded) {
      imagesDownloaded++;
    } else {
      imagesSkipped++;
    }
  }

  // Write output
  const outputPath = join(rawDir, "questions.base.json");
  await writeFile(outputPath, JSON.stringify(questions, null, 2) + "\n", "utf8");

  const generalCount = questions.filter((q) => q.category === "general").length;
  const stateCount = questions.filter((q) => q.category === "state").length;
  const withImageCount = questions.filter((q) => q.image !== null).length;

  console.log(`\nDone!`);
  console.log(`  Total questions:   ${questions.length}`);
  console.log(`  General:           ${generalCount}`);
  console.log(`  State:             ${stateCount}`);
  console.log(`  With image:        ${withImageCount}`);
  console.log(`  Images downloaded: ${imagesDownloaded}`);
  console.log(`  Images skipped:    ${imagesSkipped} (already present)`);
  console.log(`  Output:            ${outputPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
