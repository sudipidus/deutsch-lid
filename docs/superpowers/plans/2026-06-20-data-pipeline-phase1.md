# Leben in Deutschland — Phase 1: Data Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a re-runnable TypeScript/Node pipeline that sources the Leben in Deutschland question catalog and uses the Claude API to produce two validated JSON files — `data/questions.json` (questions + per-question explanations) and `data/words.json` (a deduped German word dictionary with etymology/meaning/context).

**Architecture:** A set of small, single-purpose modules under `scripts/` plus a shared tokenizer under `src/lib/` (shared so the future React app splits text identically). Pure transforms (tokenize, normalize, assemble, validate) are unit-tested with TDD. API generation is split into a pure prompt-builder + a pure response→entry mapper + a thin injected Anthropic adapter, so all logic is testable without the network. A generic manifest-backed runner makes generation idempotent and resumable.

**Tech Stack:** TypeScript, Node 20+, `tsx` (run TS directly), `vitest` (tests), `zod` (schema validation), `@anthropic-ai/sdk` (generation), `playwright` (scrape fallback).

## Global Constraints

- Node 20+; ESM modules (`"type": "module"` in `package.json`). In ESM, `__dirname` is undefined — derive paths from `import.meta.url`.
- Claude model: default `claude-opus-4-8`, overridable via `LID_MODEL` env var. Never hardcode another model string.
- Anthropic SDK: use the official `@anthropic-ai/sdk`. Adaptive thinking only — `thinking: { type: "adaptive" }`; never pass `budget_tokens`, `temperature`, `top_p`, or `top_k` (all 400 on Opus 4.8). Structured output via `client.messages.parse()` with `zodOutputFormat`.
- API key from `ANTHROPIC_API_KEY` env var — never hardcoded.
- All emitted JSON validates against its zod schema before being written; a validation failure aborts the build (non-zero exit).
- The tokenizer module is the single source of truth for splitting text into words; no other module may re-implement word splitting.
- Word-dictionary keys (aliases) are normalized surface forms: lowercased, the literal output of `normalizeWord`.

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `src/lib/.gitkeep`
- Create: `scripts/.gitkeep`
- Create: `data/.gitkeep`

**Interfaces:**
- Produces: a working `npm test` (vitest) and `npm run pipeline` (tsx) command surface. No exported code yet.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "deutsch-lid-pipeline",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "scrape": "tsx scripts/scrape.ts",
    "gen:words": "tsx scripts/generate-words.ts",
    "gen:explanations": "tsx scripts/generate-explanations.ts",
    "build:data": "tsx scripts/build-data.ts"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.69.0",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "playwright": "^1.48.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "types": ["node"],
    "noEmit": true
  },
  "include": ["src", "scripts"]
}
```

- [ ] **Step 3: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Write `.gitignore`**

```
node_modules/
data/raw/
data/images/
.env
```

- [ ] **Step 5: Create placeholder dirs** so the tree exists.

Create empty files `src/lib/.gitkeep`, `scripts/.gitkeep`, `data/.gitkeep`.

- [ ] **Step 6: Install and verify**

Run: `npm install && npm test`
Expected: install succeeds; vitest reports "No test files found" and exits 0.

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts .gitignore src scripts data
git commit -m "chore: scaffold data pipeline project"
```

---

### Task 2: Shared tokenizer

**Files:**
- Create: `src/lib/tokenizer.ts`
- Test: `src/lib/tokenizer.test.ts`

**Interfaces:**
- Produces:
  - `interface Token { text: string; isWord: boolean }`
  - `function tokenize(text: string): Token[]` — splits into alternating word / non-word tokens; a word is a maximal run of Unicode letters (`\p{L}`), which covers ä/ö/ü/ß. Concatenating all `token.text` reproduces the input exactly.
  - `function normalizeWord(word: string): string` — `word.toLowerCase()`. Used as the alias-map key.
  - `function extractWords(text: string): string[]` — the `text` of every word token, in order, original case.

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/tokenizer.test.ts`
Expected: FAIL — cannot find module `./tokenizer.js`.

- [ ] **Step 3: Write the implementation**

```ts
export interface Token {
  text: string;
  isWord: boolean;
}

const WORD_RE = /\p{L}+/gu;

export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(WORD_RE)) {
    const start = match.index;
    if (start > lastIndex) {
      tokens.push({ text: text.slice(lastIndex, start), isWord: false });
    }
    tokens.push({ text: match[0], isWord: true });
    lastIndex = start + match[0].length;
  }
  if (lastIndex < text.length) {
    tokens.push({ text: text.slice(lastIndex), isWord: false });
  }
  return tokens;
}

export function normalizeWord(word: string): string {
  return word.toLowerCase();
}

export function extractWords(text: string): string[] {
  return tokenize(text)
    .filter((t) => t.isWord)
    .map((t) => t.text);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/tokenizer.test.ts`
Expected: PASS (all 4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/tokenizer.ts src/lib/tokenizer.test.ts
git commit -m "feat: shared German tokenizer"
```

---

### Task 3: Data schemas and types

**Files:**
- Create: `src/lib/schemas.ts`
- Test: `src/lib/schemas.test.ts`

**Interfaces:**
- Produces:
  - `QuestionSchema` (zod) and `type Question = z.infer<typeof QuestionSchema>` with fields: `id: number`, `category: "general" | "state"`, `state: string | null`, `question: string`, `image: string | null`, `options: string[]` (length 4), `answerIndex: number` (int 0–3), `explanation: string`.
  - `QuestionsSchema = z.array(QuestionSchema)`.
  - `WordEntrySchema` (zod) and `type WordEntry`: `pos: string`, `article: string | null`, `meaning: string`, `etymology: string`, `context: string`.
  - `WordsFileSchema` and `type WordsFile`: `{ aliases: Record<string,string>; entries: Record<string, WordEntry> }`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { QuestionSchema, WordsFileSchema } from "./schemas.js";

describe("QuestionSchema", () => {
  const valid = {
    id: 1,
    category: "general",
    state: null,
    question: "Was ist das?",
    image: null,
    options: ["a", "b", "c", "d"],
    answerIndex: 2,
    explanation: "Because.",
  };

  it("accepts a valid question", () => {
    expect(() => QuestionSchema.parse(valid)).not.toThrow();
  });

  it("rejects answerIndex out of range", () => {
    expect(() => QuestionSchema.parse({ ...valid, answerIndex: 4 })).toThrow();
  });

  it("rejects options of the wrong length", () => {
    expect(() =>
      QuestionSchema.parse({ ...valid, options: ["a", "b", "c"] }),
    ).toThrow();
  });
});

describe("WordsFileSchema", () => {
  it("accepts a valid words file", () => {
    const wf = {
      aliases: { bundesländer: "Bundesland" },
      entries: {
        Bundesland: {
          pos: "noun",
          article: "das",
          meaning: "federal state",
          etymology: "Bund + Land",
          context: "Germany has 16.",
        },
      },
    };
    expect(() => WordsFileSchema.parse(wf)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/schemas.test.ts`
Expected: FAIL — cannot find module `./schemas.js`.

- [ ] **Step 3: Write the implementation**

```ts
import { z } from "zod";

export const QuestionSchema = z.object({
  id: z.number().int(),
  category: z.enum(["general", "state"]),
  state: z.string().nullable(),
  question: z.string().min(1),
  image: z.string().nullable(),
  options: z.array(z.string().min(1)).length(4),
  answerIndex: z.number().int().min(0).max(3),
  explanation: z.string(),
});
export type Question = z.infer<typeof QuestionSchema>;

export const QuestionsSchema = z.array(QuestionSchema);
export type Questions = z.infer<typeof QuestionsSchema>;

export const WordEntrySchema = z.object({
  pos: z.string(),
  article: z.string().nullable(),
  meaning: z.string(),
  etymology: z.string(),
  context: z.string(),
});
export type WordEntry = z.infer<typeof WordEntrySchema>;

export const WordsFileSchema = z.object({
  aliases: z.record(z.string(), z.string()),
  entries: z.record(z.string(), WordEntrySchema),
});
export type WordsFile = z.infer<typeof WordsFileSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/schemas.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/schemas.ts src/lib/schemas.test.ts
git commit -m "feat: zod schemas for questions and word dictionary"
```

---

### Task 4: Raw-question normalizer

**Files:**
- Create: `src/lib/normalize-question.ts`
- Test: `src/lib/normalize-question.test.ts`

**Interfaces:**
- Consumes: nothing from prior tasks at runtime (it produces a question with `explanation: ""`, filled later).
- Produces:
  - `interface RawQuestion { id: number | string; category?: string; state?: string | null; question: string; image?: string | null; options: string[]; answerIndex?: number; answer?: string }`
  - `function normalizeQuestion(raw: RawQuestion): Omit<Question, "explanation"> & { explanation: string }` — coerces `id` to a number, defaults `category` to `"general"` and `state` to `null`, resolves the correct option index (`answerIndex` if present, else the index of `answer` within `options`), sets `explanation: ""`. Throws if it can't resolve a 0–3 answer index or if `options.length !== 4`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { normalizeQuestion } from "./normalize-question.js";

describe("normalizeQuestion", () => {
  it("resolves answerIndex from an answer string", () => {
    const q = normalizeQuestion({
      id: "5",
      question: "Frage?",
      options: ["w", "x", "y", "z"],
      answer: "y",
    });
    expect(q.id).toBe(5);
    expect(q.answerIndex).toBe(2);
    expect(q.category).toBe("general");
    expect(q.state).toBeNull();
    expect(q.explanation).toBe("");
  });

  it("keeps an explicit answerIndex", () => {
    const q = normalizeQuestion({
      id: 1,
      question: "Frage?",
      options: ["w", "x", "y", "z"],
      answerIndex: 0,
    });
    expect(q.answerIndex).toBe(0);
  });

  it("throws when the answer cannot be resolved", () => {
    expect(() =>
      normalizeQuestion({
        id: 1,
        question: "Frage?",
        options: ["w", "x", "y", "z"],
        answer: "nope",
      }),
    ).toThrow();
  });

  it("throws when options length is not 4", () => {
    expect(() =>
      normalizeQuestion({ id: 1, question: "Q", options: ["a", "b"], answerIndex: 0 }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/normalize-question.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write the implementation**

```ts
import type { Question } from "./schemas.js";

export interface RawQuestion {
  id: number | string;
  category?: string;
  state?: string | null;
  question: string;
  image?: string | null;
  options: string[];
  answerIndex?: number;
  answer?: string;
}

export function normalizeQuestion(raw: RawQuestion): Question {
  if (raw.options.length !== 4) {
    throw new Error(`Question ${raw.id} must have 4 options, got ${raw.options.length}`);
  }
  let answerIndex = raw.answerIndex;
  if (answerIndex === undefined && raw.answer !== undefined) {
    answerIndex = raw.options.indexOf(raw.answer);
  }
  if (answerIndex === undefined || answerIndex < 0 || answerIndex > 3) {
    throw new Error(`Question ${raw.id}: could not resolve a 0-3 answer index`);
  }
  const category = raw.category === "state" ? "state" : "general";
  return {
    id: typeof raw.id === "string" ? Number(raw.id) : raw.id,
    category,
    state: raw.state ?? null,
    question: raw.question,
    image: raw.image ?? null,
    options: raw.options,
    answerIndex,
    explanation: "",
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/normalize-question.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/normalize-question.ts src/lib/normalize-question.test.ts
git commit -m "feat: raw question normalizer"
```

---

### Task 5: Source the catalog (import or scrape)

**Files:**
- Create: `scripts/scrape.ts`
- Create: `scripts/source-readme.md`

**Interfaces:**
- Consumes: `normalizeQuestion` (Task 4), `QuestionsSchema` minus explanation — validate each normalized record with `QuestionSchema.omit({ explanation: true })`.
- Produces: `data/raw/questions.base.json` — a JSON array of normalized questions (each with `explanation: ""`), validated. This is the input to Tasks 6–9.

This task is procedural (a scraper/importer), not TDD — its correctness is verified by the row count and a schema check at the end.

- [ ] **Step 1: Decide the source**

First try to find a reliable open dataset of the Leben in Deutschland / Einbürgerungstest catalog (300 general + 16×10 state questions). If a trustworthy machine-readable source is found, write `scripts/import.ts` instead that maps it through `normalizeQuestion`. Record the chosen source and its license in `scripts/source-readme.md`. If none is found, scrape the official BAMF tool as below.

- [ ] **Step 2: Write the Playwright scraper**

`scripts/scrape.ts` drives `https://oet.bamf.de/ords/oetut/f?p=534:30` with Playwright. For each question it captures the prompt text, the four options, the marked-correct option, and — when the question is image-based — downloads the image to `data/images/q<id>.<ext>` and sets `image` to that relative path. State-specific questions set `category: "state"` and the two-letter `state` code. Each scraped record is passed through `normalizeQuestion`.

```ts
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { normalizeQuestion, type RawQuestion } from "../src/lib/normalize-question.js";
import { QuestionSchema } from "../src/lib/schemas.js";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, "..", "data");
const BaseQuestionSchema = QuestionSchema.omit({ explanation: true });

async function scrapeRawQuestions(): Promise<RawQuestion[]> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto("https://oet.bamf.de/ords/oetut/f?p=534:30");
    // TODO during implementation: walk the APEX form, paging through all
    // questions, extracting prompt / options / correct answer / image / state.
    // Return one RawQuestion per question.
    throw new Error("scrape extraction not yet implemented");
  } finally {
    await browser.close();
  }
}

async function main() {
  await mkdir(join(dataDir, "raw"), { recursive: true });
  await mkdir(join(dataDir, "images"), { recursive: true });
  const raw = await scrapeRawQuestions();
  const questions = raw.map(normalizeQuestion);
  for (const q of questions) BaseQuestionSchema.parse(q);
  await writeFile(
    join(dataDir, "raw", "questions.base.json"),
    JSON.stringify(questions, null, 2),
  );
  console.log(`Wrote ${questions.length} questions`);
}

main();
```

> The `scrapeRawQuestions` body is the only part to flesh out at implementation time — open the page in a headed browser first (`chromium.launch({ headless: false })`) to learn the APEX form's structure, then replace the `TODO`. Keep extraction logic here; do not duplicate `normalizeQuestion`.

- [ ] **Step 3: Run and verify the count**

Run: `npx playwright install chromium && npm run scrape`
Expected: writes `data/raw/questions.base.json`; logged count is in the expected range (≈300 general; ≈460 if all 16 states are captured). Open the file and spot-check three records: prompt, four options, a 0–3 `answerIndex`, and that image-based questions reference a downloaded file.

- [ ] **Step 4: Commit** (the JSON and images are gitignored; commit only the scripts)

```bash
git add scripts/scrape.ts scripts/source-readme.md
git commit -m "feat: BAMF catalog scraper producing questions.base.json"
```

---

### Task 6: Collect unique words

**Files:**
- Create: `src/lib/collect-words.ts`
- Test: `src/lib/collect-words.test.ts`

**Interfaces:**
- Consumes: `extractWords`, `normalizeWord` (Task 2); `Question` type (Task 3).
- Produces:
  - `interface WordOccurrence { surface: string; sentence: string }` — a representative surface form (first seen) and one example sentence containing it.
  - `function collectWords(questions: Question[]): WordOccurrence[]` — over every question's `question` text and all four `options`, extract words; dedupe by `normalizeWord`; keep the first-seen surface form and the text it appeared in. Stable order (first appearance).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { collectWords } from "./collect-words.js";
import type { Question } from "./schemas.js";

const q = (over: Partial<Question>): Question => ({
  id: 1,
  category: "general",
  state: null,
  question: "Was ist das?",
  image: null,
  options: ["der Bund", "das Land", "die Stadt", "das Dorf"],
  answerIndex: 0,
  explanation: "",
  ...over,
});

describe("collectWords", () => {
  it("dedupes by normalized form across question and options", () => {
    const words = collectWords([q({ question: "Das ist das Land." })]);
    const surfaces = words.map((w) => w.surface);
    // "Das"/"das" collapse to one entry; "Land" appears once
    expect(surfaces.filter((s) => s.toLowerCase() === "das")).toHaveLength(1);
    expect(surfaces).toContain("Land");
  });

  it("attaches a sentence containing the word", () => {
    const words = collectWords([q({})]);
    const bund = words.find((w) => w.surface === "Bund");
    expect(bund?.sentence).toContain("Bund");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/collect-words.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write the implementation**

```ts
import { extractWords, normalizeWord } from "./tokenizer.js";
import type { Question } from "./schemas.js";

export interface WordOccurrence {
  surface: string;
  sentence: string;
}

export function collectWords(questions: Question[]): WordOccurrence[] {
  const seen = new Map<string, WordOccurrence>();
  const consider = (text: string) => {
    for (const surface of extractWords(text)) {
      const key = normalizeWord(surface);
      if (!seen.has(key)) seen.set(key, { surface, sentence: text });
    }
  };
  for (const q of questions) {
    consider(q.question);
    for (const opt of q.options) consider(opt);
  }
  return [...seen.values()];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/collect-words.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/collect-words.ts src/lib/collect-words.test.ts
git commit -m "feat: collect unique words from the catalog"
```

---

### Task 7: Word-entry generation (prompt + assembly, pure)

**Files:**
- Create: `src/lib/word-gen.ts`
- Test: `src/lib/word-gen.test.ts`

**Interfaces:**
- Consumes: `normalizeWord` (Task 2); `WordEntry`, `WordsFile` types (Task 3); `WordOccurrence` (Task 6).
- Produces:
  - `RawWordGenSchema` (zod) and `type RawWordGen`: `{ lemma: string; pos: string; article: string | null; meaning: string; etymology: string; context: string }` — the structured-output shape the model returns.
  - `function buildWordPrompt(occ: WordOccurrence): string` — instructs the model to lemmatize `occ.surface` in the context of `occ.sentence` and return etymology/meaning/context, plus article for nouns (else `null`).
  - `type GenerateWord = (occ: WordOccurrence) => Promise<RawWordGen>` — the injected adapter type.
  - `function assembleWordsFile(pairs: Array<{ surface: string; gen: RawWordGen }>): WordsFile` — builds `entries` keyed by lemma (last write wins on duplicate lemma) and `aliases` mapping `normalizeWord(surface) → lemma`.

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/word-gen.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write the implementation**

```ts
import { z } from "zod";
import { normalizeWord } from "./tokenizer.js";
import type { WordsFile } from "./schemas.js";
import type { WordOccurrence } from "./collect-words.js";

export const RawWordGenSchema = z.object({
  lemma: z.string(),
  pos: z.string(),
  article: z.string().nullable(),
  meaning: z.string(),
  etymology: z.string(),
  context: z.string(),
});
export type RawWordGen = z.infer<typeof RawWordGenSchema>;

export type GenerateWord = (occ: WordOccurrence) => Promise<RawWordGen>;

export function buildWordPrompt(occ: WordOccurrence): string {
  return [
    "You are a German lexicographer helping a learner study for the",
    '"Leben in Deutschland" test.',
    `Analyze the German word "${occ.surface}" as it appears in this sentence:`,
    `"${occ.sentence}"`,
    "Return: its dictionary base form (lemma); part of speech (pos);",
    'the definite article ("der"/"die"/"das") if it is a noun, otherwise null;',
    "a concise English meaning; a short etymology; and one sentence of context",
    "explaining how the word is used or why it matters in this question.",
  ].join(" ");
}

export function assembleWordsFile(
  pairs: Array<{ surface: string; gen: RawWordGen }>,
): WordsFile {
  const entries: WordsFile["entries"] = {};
  const aliases: WordsFile["aliases"] = {};
  for (const { surface, gen } of pairs) {
    entries[gen.lemma] = {
      pos: gen.pos,
      article: gen.article,
      meaning: gen.meaning,
      etymology: gen.etymology,
      context: gen.context,
    };
    aliases[normalizeWord(surface)] = gen.lemma;
  }
  return { aliases, entries };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/word-gen.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/word-gen.ts src/lib/word-gen.test.ts
git commit -m "feat: word-entry prompt builder and dictionary assembler"
```

---

### Task 8: Resumable manifest runner

**Files:**
- Create: `src/lib/run-with-manifest.ts`
- Test: `src/lib/run-with-manifest.test.ts`

**Interfaces:**
- Produces:
  - `function runWithManifest<I, O>(opts: { items: I[]; keyOf: (item: I) => string; manifestPath: string; concurrency?: number; run: (item: I) => Promise<O> }): Promise<Array<{ key: string; result: O }>>` — for each item whose key is absent from the on-disk manifest, calls `run`, then appends `{ key, result }` to the manifest file (one JSON object per line). On a re-run, already-recorded keys are returned from the manifest without calling `run`. Processes with bounded concurrency (default 4). The returned array covers all input items (cached + freshly run).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runWithManifest } from "./run-with-manifest.js";

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "manifest-"));
});

describe("runWithManifest", () => {
  it("runs all items once and records them", async () => {
    const calls: string[] = [];
    const out = await runWithManifest({
      items: ["a", "b"],
      keyOf: (x) => x,
      manifestPath: join(dir, "m.jsonl"),
      run: async (x) => {
        calls.push(x);
        return x.toUpperCase();
      },
    });
    expect(calls.sort()).toEqual(["a", "b"]);
    expect(out.find((r) => r.key === "a")?.result).toBe("A");
    await rm(dir, { recursive: true, force: true });
  });

  it("skips items already in the manifest on re-run", async () => {
    const path = join(dir, "m.jsonl");
    await runWithManifest({
      items: ["a"],
      keyOf: (x) => x,
      manifestPath: path,
      run: async (x) => x.toUpperCase(),
    });
    const calls: string[] = [];
    const out = await runWithManifest({
      items: ["a", "b"],
      keyOf: (x) => x,
      manifestPath: path,
      run: async (x) => {
        calls.push(x);
        return x.toUpperCase();
      },
    });
    expect(calls).toEqual(["b"]); // "a" came from the manifest
    expect(out).toHaveLength(2);
    await rm(dir, { recursive: true, force: true });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/run-with-manifest.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write the implementation**

```ts
import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";

interface Entry<O> {
  key: string;
  result: O;
}

async function readManifest<O>(path: string): Promise<Map<string, O>> {
  const map = new Map<string, O>();
  try {
    const text = await readFile(path, "utf8");
    for (const line of text.split("\n")) {
      if (!line.trim()) continue;
      const entry = JSON.parse(line) as Entry<O>;
      map.set(entry.key, entry.result);
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
  return map;
}

export async function runWithManifest<I, O>(opts: {
  items: I[];
  keyOf: (item: I) => string;
  manifestPath: string;
  concurrency?: number;
  run: (item: I) => Promise<O>;
}): Promise<Array<{ key: string; result: O }>> {
  const { items, keyOf, manifestPath, run, concurrency = 4 } = opts;
  await mkdir(dirname(manifestPath), { recursive: true });
  const done = await readManifest<O>(manifestPath);

  const pending = items.filter((it) => !done.has(keyOf(it)));
  let cursor = 0;
  async function worker() {
    while (cursor < pending.length) {
      const item = pending[cursor++];
      const key = keyOf(item);
      const result = await run(item);
      done.set(key, result);
      await appendFile(manifestPath, JSON.stringify({ key, result }) + "\n");
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, pending.length || 1) }, worker),
  );

  return items.map((it) => {
    const key = keyOf(it);
    return { key, result: done.get(key)! };
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/run-with-manifest.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/run-with-manifest.ts src/lib/run-with-manifest.test.ts
git commit -m "feat: resumable manifest-backed runner"
```

---

### Task 9: Anthropic adapter

**Files:**
- Create: `src/lib/anthropic.ts`

**Interfaces:**
- Consumes: `RawWordGenSchema`, `buildWordPrompt`, `GenerateWord`, `RawWordGen` (Task 7); `WordOccurrence` (Task 6).
- Produces:
  - `function makeClient(): Anthropic` — constructs the SDK client (reads `ANTHROPIC_API_KEY`).
  - `const MODEL = process.env.LID_MODEL ?? "claude-opus-4-8"`.
  - `function createWordGenerator(client: Anthropic): GenerateWord` — calls `client.messages.parse` with `zodOutputFormat(RawWordGenSchema)` and the prompt from `buildWordPrompt`.
  - `function generateExplanation(client: Anthropic, prompt: string): Promise<string>` — single call returning the first text block.

This task is a thin I/O wrapper around the SDK; it is exercised by the Task 10/11 runner scripts against the live API rather than unit-tested.

- [ ] **Step 1: Write the adapter**

```ts
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { RawWordGenSchema, buildWordPrompt, type GenerateWord } from "./word-gen.js";

export const MODEL = process.env.LID_MODEL ?? "claude-opus-4-8";

export function makeClient(): Anthropic {
  return new Anthropic();
}

export function createWordGenerator(client: Anthropic): GenerateWord {
  return async (occ) => {
    const res = await client.messages.parse({
      model: MODEL,
      max_tokens: 1024,
      thinking: { type: "adaptive" },
      messages: [{ role: "user", content: buildWordPrompt(occ) }],
      output_config: { format: zodOutputFormat(RawWordGenSchema) },
    });
    if (!res.parsed_output) {
      throw new Error(`No parsed output for word "${occ.surface}"`);
    }
    return res.parsed_output;
  };
}

export async function generateExplanation(
  client: Anthropic,
  prompt: string,
): Promise<string> {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: prompt }],
  });
  const text = res.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") {
    throw new Error("No text block in explanation response");
  }
  return text.text;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (If `messages.parse` / `zodOutputFormat` types resolve differently in the installed SDK version, adjust the import path per the SDK's structured-output helper, keeping the same behavior.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/anthropic.ts
git commit -m "feat: Anthropic adapter for word and explanation generation"
```

---

### Task 10: Generate word entries (runner script)

**Files:**
- Create: `scripts/generate-words.ts`

**Interfaces:**
- Consumes: `collectWords` (6), `createWordGenerator`/`makeClient` (9), `runWithManifest` (8), `assembleWordsFile`/`RawWordGen` (7), `QuestionSchema` (3).
- Produces: `data/words.json` (validated `WordsFile`).

- [ ] **Step 1: Write the runner**

```ts
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { z } from "zod";
import { QuestionSchema } from "../src/lib/schemas.js";
import { collectWords } from "../src/lib/collect-words.js";
import { runWithManifest } from "../src/lib/run-with-manifest.js";
import { assembleWordsFile, type RawWordGen } from "../src/lib/word-gen.js";
import { WordsFileSchema } from "../src/lib/schemas.js";
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
  const results = await runWithManifest<typeof occurrences[number], RawWordGen>({
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

main();
```

- [ ] **Step 2: Run against a small slice first**

Temporarily slice `occurrences` to the first 5 (e.g. `.slice(0, 5)`) and run `ANTHROPIC_API_KEY=… npm run gen:words`. Inspect `data/words.json`: 5 plausible entries, correct articles on nouns, an alias map. Remove the slice.

- [ ] **Step 3: Full run and verify**

Run: `npm run gen:words`
Expected: completes (resuming if interrupted via the manifest); `data/words.json` validates and has roughly one entry per unique lemma. Confirm a re-run is near-instant (all keys cached).

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-words.ts data/words.json
git commit -m "feat: generate word dictionary"
```

---

### Task 11: Generate explanations + assemble final questions

**Files:**
- Create: `src/lib/explanation-prompt.ts`
- Test: `src/lib/explanation-prompt.test.ts`
- Create: `scripts/generate-explanations.ts`

**Interfaces:**
- Consumes: `Question` (3), `generateExplanation`/`makeClient` (9), `runWithManifest` (8), `QuestionsSchema` (3).
- Produces:
  - `function buildExplanationPrompt(q: Question): string` (pure, tested) — includes the question, the four options, and which one is correct, asking for a short explanation of why it's right plus civic/cultural background.
  - `data/questions.json` — the validated final `Question[]` with `explanation` filled in.

- [ ] **Step 1: Write the failing test for the prompt builder**

```ts
import { describe, it, expect } from "vitest";
import { buildExplanationPrompt } from "./explanation-prompt.js";
import type { Question } from "./schemas.js";

const q: Question = {
  id: 1,
  category: "general",
  state: null,
  question: "Was ist die Hauptstadt Deutschlands?",
  image: null,
  options: ["Berlin", "München", "Hamburg", "Köln"],
  answerIndex: 0,
  explanation: "",
};

describe("buildExplanationPrompt", () => {
  it("includes the question and marks the correct option", () => {
    const p = buildExplanationPrompt(q);
    expect(p).toContain("Was ist die Hauptstadt Deutschlands?");
    expect(p).toContain("Berlin");
    expect(p.toLowerCase()).toContain("correct");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/explanation-prompt.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write the prompt builder**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/explanation-prompt.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the runner**

```ts
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

main();
```

- [ ] **Step 6: Run against a slice, then fully**

Slice `base` to 3 for a smoke test (`ANTHROPIC_API_KEY=… npm run gen:explanations`), inspect explanations, remove the slice, then run fully.
Expected: `data/questions.json` validates against `QuestionsSchema`; every question has a non-empty `explanation`.

- [ ] **Step 7: Commit**

```bash
git add src/lib/explanation-prompt.ts src/lib/explanation-prompt.test.ts scripts/generate-explanations.ts data/questions.json
git commit -m "feat: generate per-question explanations and final questions.json"
```

---

### Task 12: End-to-end validation gate

**Files:**
- Create: `scripts/build-data.ts`

**Interfaces:**
- Consumes: `QuestionsSchema`, `WordsFileSchema` (3); the shared tokenizer (2).
- Produces: a single `npm run build:data` command that validates the emitted artifacts and the cross-reference invariant (every tappable word in `questions.json` resolves to an entry in `words.json`), exiting non-zero on any failure. This is the build gate the future app depends on.

- [ ] **Step 1: Write the validator**

```ts
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
```

- [ ] **Step 2: Run the gate**

Run: `npm run build:data`
Expected: prints the OK line and exits 0. If words are missing, it lists them — re-run `npm run gen:words` (it resumes and fills gaps), then re-run the gate.

- [ ] **Step 3: Commit**

```bash
git add scripts/build-data.ts
git commit -m "feat: end-to-end data validation gate"
```
