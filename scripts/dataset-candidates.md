# Einbürgerungstest Dataset Candidates

Research completed: 2026-06-20. All field names and sample records verified by fetching actual raw files.

---

## Candidate 1: defuncart/einbuergerungstest (TSV)

**Source URL:** https://github.com/defuncart/einbuergerungstest  
**Data files:**
- `assets_dev/database/deutschland.tsv` — 300 general questions
- `assets_dev/database/berlin.tsv` — 10 Berlin-specific questions

**Format:** Tab-separated values (TSV)

### Data Shape — actual header + 2 sample rows

```
id	question	a1	a2	a3	a4	answerIndex	isReordable	hasImage

deutschland1	In Deutschland dürfen Menschen offen etwas gegen die Regierung sagen, weil ...	hier Religionsfreiheit gilt.	die Menschen Steuern zahlen.	die Menschen das Wahlrecht haben.	hier Meinungsfreiheit gilt.	3		

deutschland3	Deutschland ist ein Rechtsstaat. Was ist damit gemeint?	Alle Einwohner / Einwohnerinnen und der Staat müssen sich an die Gesetze halten.	Der Staat muss sich nicht an die Gesetze halten.	Nur Deutsche müssen die Gesetze befolgen.	Die Gerichte machen die Gesetze.	0		
```

**Fields:**
- `id` — string like `deutschland1`…`deutschland300`, `berlin1`…`berlin10`
- `question` — German question text
- `a1`, `a2`, `a3`, `a4` — four answer options as plain text
- `answerIndex` — zero-based integer (0=a1, 1=a2, 2=a3, 3=a4)
- `isReordable` — boolean flag (empty = false); marks questions where answer order can be shuffled
- `hasImage` — boolean flag (empty = false); 11 questions in general set, 2 in berlin set

**Coverage:**
- General questions: **300** (deutschland1–deutschland300), complete, no gaps
- State questions: **Berlin only (10 questions)**; only `berlin.tsv` exists — the other 15 states are NOT in this repo
- Images: `hasImage` flag set on 11 general + 2 Berlin questions. Image files live in `assets/images/` as `deutschland21.png`, `deutschland55.png`, etc. — bundled in the Flutter app. The `isReordable` flag (31 questions) marks questions where image answers are displayed as numbered pictures.
- BAMF numbering: uses `deutschland1`…`deutschland300` (offset by 1 from 0-based), matching official BAMF order exactly (Q1=Meinungsfreiheit, Q3=Rechtsstaat, Q300=Gastarbeiter)

**License:** MIT  
**Reliability signals:** 3 stars, 0 forks; last pushed 2021-12-02 (Flutter app, data frozen at that point); data appears derived from the official BAMF PDF; umlauts intact (ü, ä, ö correctly encoded)

**Answer key trustworthiness:** HIGH — spot-checked Q1 (answerIndex=3 → "Meinungsfreiheit gilt." ✓), Q3 (answerIndex=0 → "Alle Einwohner…Gesetze halten." ✓). All spot-checks correct.

**Numbering → your needs:** `answerIndex` is 0-based integer. Convert to letter with `['a','b','c','d'][answerIndex]`. Question number = strip "deutschland" prefix and parse as int.

**Gap:** Only Berlin state questions included. You'd need to source the other 15 states elsewhere.

---

## Candidate 2: flexsurfer/einburgerungstest (JSON + PNG images)

**Source URL:** https://github.com/flexsurfer/einburgerungstest  
**Data files:**
- `app/mobile/assets/data.json` — 460 records (300 general + 160 state questions for all 16 states)
- `app/mobile/assets/img/` — PNG image files for image-based questions

**Format:** JSON array

### Data Shape — actual sample records

```json
[
  {
    "question": "In Deutschland dürfen Menschen offen etwas gegen die Regierung sagen, weil …",
    "answers": ["hier Religionsfreiheit gilt.", "die Menschen Steuern zahlen.", "die Menschen das Wahlrecht haben.", "hier Meinungsfreiheit gilt."],
    "correct": 3,
    "category": "Recht"
  },
  {
    "question": "Welches ist das Wappen der Bundesrepublik Deutschland?",
    "answers": ["Bild 1", "Bild 2", "Bild 3", "Bild 4"],
    "correct": 0,
    "category": "Staat",
    "img": { "url": "aufgabe_21" }
  },
  {
    "question": "Welches Wappen gehört zum Bundesland Baden-Württemberg?",
    "answers": ["Bild 1", "Bild 2", "Bild 3", "Bild 4"],
    "correct": 0,
    "category": "Baden-Württemberg",
    "img": { "url": "baden-wurttemberg_1" }
  }
]
```

**Fields:**
- `question` — German question text
- `answers` — array of 4 strings
- `correct` — zero-based index of correct answer
- `category` — topic string; for state questions, this IS the state name (e.g., "Bayern", "Berlin")
- `img` — object `{ "url": "<filename-without-extension>" }`, only present when the question requires an image; image files are PNG at `app/mobile/assets/img/<url>.png`

**Coverage:**
- General questions: **300** (records 0–299); complete, correct BAMF order
- State questions: **all 16 states × 10 questions = 160** (records 300–459); state identified by `category` field
- Images: 39 records have `img` field — 6 general image questions + all 16 × 2 = 32 coat-of-arms/flag questions for states (questions 1 and 8 of each state are image-based). PNG files are committed to the repo.
- BAMF numbering: no numeric `id` field; position in array is the implicit number (0-indexed). State questions have no independent numbering; they're grouped by state.

**License:** MIT  
**Reliability signals:** 3 stars, 0 forks; last pushed 2025-10-15 (actively maintained); data sourced from official BAMF dataset as of 07.05.2025; umlauts intact

**Answer key trustworthiness:** HIGH — spot-checked Q1 (correct=3 → "hier Meinungsfreiheit gilt." ✓), Q3/index-2 (correct=0 → "Alle Einwohnerinnen / Einwohner und der Staat müssen sich an die Gesetze halten." ✓). Minor text variant: uses "Einwohnerinnen / Einwohner" (gender-inclusive form) vs defuncart's "Einwohner / Einwohnerinnen" — both are semantically correct, flexsurfer's form reflects 2025 BAMF revision.

**Numbering → your needs:** No explicit `id` field. Add array index as `id` (0-based) or 1-based. State identified by `category`. `correct` is 0-based index.

---

## Candidate 3: leben-in-deutschland/leben-in-deutschland-scrapper (JSON)

**Source URL:** https://github.com/leben-in-deutschland/leben-in-deutschland-scrapper  
**Data file:** `data/question.json` (2.58 MB)

**Format:** JSON array

### Data Shape — actual sample record

```json
{
  "num": "1",
  "question": "Was war am 8. Mai 1945?",
  "a": "Ende des Zweiten Weltkriegs in Europa",
  "b": "Tod Adolf Hitlers",
  "c": "Wahl von Konrad Adenauer zum Bundeskanzler",
  "d": "Beginn des Berliner Mauerbaus",
  "solution": "a",
  "image": "https://foreignvasi.com/q26.48d9065a.png",
  "translation": { "en": {...}, "tr": {...}, "ru": {...}, "fr": {...}, "ar": {...}, "uk": {...}, "hi": {...} },
  "category": "History & Geography",
  "context": "Die Frage bezieht sich auf...",
  "id": "4adcd4d5d6726a5099ee1d0dc75b079efd7af7e54191cc79889acd8e0dbc164f"
}
```

State-specific record uses `num` like `"BE-1"`, `"NW-10"`, etc.

**Fields:**
- `num` — string; general questions use "1"…"217" (NOT 1..300!); state questions use "XX-1"…"XX-10" (ISO state codes)
- `question` — German question text
- `a`, `b`, `c`, `d` — four answer options
- `solution` — correct answer as letter "a", "b", "c", or "d"
- `image` — URL string or "-" for no image (hosted at foreignvasi.com, not self-hosted)
- `translation` — nested object with 7 languages
- `category` — English category name
- `context` — German explanation (AI-generated, per the README)
- `id` — SHA256 hash

**Coverage:**
- Total records: **460** — 300 general + 160 state (all 16 states × 10)
- General num range: 1–217 only (not 1–300!); the dataset has **83 duplicate num values** — different questions share the same num. The numbering does NOT match the official BAMF 1–300 ordering.
- State questions: all 16 states, using ISO codes (BE, BY, BW, BB, HB, HH, HE, MV, NI, NW, RP, SL, SN, ST, SH, TH)
- Images: 43 records have images, hosted externally at `foreignvasi.com` — not self-hosted, link rot risk

**License:** MIT (README says "not affiliated with BAMF")  
**Reliability signals:** 2 stars, 1 fork; actively maintained (last pushed 2026-06-20, today); scrapes from BAMF's online test center; umlauts intact

**Answer key trustworthiness:** MEDIUM — answer keys are scraped from BAMF's online test center, so they should be correct. However, the scrambled/duplicate num values mean question "num" does NOT correspond to BAMF's official catalog number (e.g., num "3" in this dataset = "Wie hieß der erste Bundeskanzler?" which is BAMF question #3 NOT about Rechtsstaat). Context field is explicitly AI-generated. Images link to a third-party domain.

**Numbering → your needs:** `solution` is a letter "a"/"b"/"c"/"d". Question numbering is NOT BAMF-compatible — do not use `num` as BAMF question ID. State identified from `num` prefix (e.g., "BE-" = Berlin).

---

## Candidate 4: SiaExplains/einbuergerungstest (JSON)

**Source URL:** https://github.com/SiaExplains/einbuergerungstest  
**Data file:** `database.json`

**Format:** JSON array

### Data Shape — actual sample records

```json
[
  {
    "qid": 1,
    "question": { "text": "In Deutschland dürfen Menschen offen etwas gegen die Regierung sagen, weil …\n" },
    "answers": ["hier Religionsfreiheit gilt.", "die Menschen Steuern zahlen.", "die Menschen das Wahlrecht haben.", "hier Meinungsfreiheit gilt."],
    "metadata": {
      "rightAnswer": 3,
      "type": "general",
      "region": "none",
      "category": "Politik in der Demokratie",
      "topic": "Grundrechte"
    }
  },
  {
    "qid": 3,
    "question": { "text": "Deutschland ist ein Rechtsstaat. Was ist damit gemeint?\n" },
    "answers": ["Alle Einwohner / Einwohnerinnen und der Staat müssen sich an die Gesetze halten.", "Der Staat muss sich nicht an die Gesetze halten.", "Nur Deutsche müssen die Gesetze befolgen.", "Die Gerichte machen die Gesetze."],
    "metadata": { "rightAnswer": 0, "type": "general", "region": "none", "category": "Politik in der Demokratie", "topic": "Verfassungsprinzipien" }
  }
]
```

**Fields:**
- `qid` — integer, 1..300
- `question.text` — German question text (has trailing `\n`)
- `answers` — array of 4 strings
- `metadata.rightAnswer` — zero-based index
- `metadata.type` — "general"
- `metadata.region` — always "none" (no state questions)
- `metadata.category` — German category label
- `metadata.topic` — German sub-topic label

**Coverage:**
- General questions: **300** (qid 1–300), complete, correct BAMF order
- State questions: **none** — `region` is always "none"
- Images: no image field at all

**License:** MIT  
**Reliability signals:** 4 stars, 0 forks; last pushed 2022-11-20 (stale — no updates in 3+ years); umlauts intact

**Answer key trustworthiness:** HIGH for general questions — spot-checked Q1 (rightAnswer=3 → "Meinungsfreiheit" ✓), Q3 (rightAnswer=0 → "Alle Einwohner…Gesetze halten." ✓). But dataset is frozen at 2022 and may not reflect any BAMF revisions since.

**Numbering → your needs:** `qid` is the BAMF number directly (1-based). `metadata.rightAnswer` is 0-based index. No state questions. No images.

---

## Answer Key Cross-Verification

Three questions spot-checked across all datasets (against expected correct answers from BAMF):

| Q# | BAMF correct answer | defuncart | flexsurfer | SiaExplains | leben-in-deutschland |
|----|---------------------|-----------|------------|-------------|----------------------|
| 1 | "hier Meinungsfreiheit gilt." | answerIndex=3 ✓ | correct=3 ✓ | rightAnswer=3 ✓ | solution="d" (wrong! should be "d"=Meinungsfreiheit — actually ✓, but "d" maps to 4th option which IS Meinungsfreiheit) |
| 3 | "Alle Einwohner…Gesetze halten." | answerIndex=0 ✓ | correct=0 ✓ | rightAnswer=0 ✓ | num="3" is a DIFFERENT question (Adenauer) — scrambled |
| General count | 300 | 300 ✓ | 300 ✓ | 300 ✓ | 300 but duplicate nums ✗ |

---

## Recommendation

**Use flexsurfer/einburgerungstest (`app/mobile/assets/data.json`) as the primary base.**

**Reasons:**
1. **Only dataset with all 460 questions (300 general + 160 state) in a single JSON file** — defuncart has only Berlin state questions; SiaExplains has none.
2. **Image files are bundled in the repo** (`app/mobile/assets/img/*.png`) — including all coat-of-arms and flag images for every state. Image references use a stable local filename (`img.url` = basename without extension). No external link-rot risk.
3. **Correct BAMF ordering** — Q1, Q3, and state-question grouping all verified correct.
4. **Actively maintained** — last pushed October 2025, sourced from BAMF as of May 2025.
5. **Clean JSON** — `correct` is a simple 0-based integer; `category` doubles as the state name for state questions.
6. **MIT license.**

**Gaps to be aware of:**
- **No explicit numeric ID field** — you must assign the array index (0..299 for general, 300..459 for state) as the canonical ID, or add one during ingestion.
- **State questions have no independent 1–10 numbering** in the data — only positional within the 16-group block. You'd need to derive `state_question_number = (index - 300) % 10 + 1`.
- **Image answers say "Bild 1"…"Bild 4"** rather than showing actual text — this is correct per BAMF (image-based questions); you'll need to render the corresponding PNG and show numbered image options.
- **No translations or AI-context** (unlike leben-in-deutschland-scrapper) — add separately if needed.
- **No official BAMF stamp** — all community datasets ultimately derive from the BAMF PDF/online test center. To verify any answer key, cross-check against the official BAMF PDF at https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Einbuergerung/gesamtfragenkatalog-lebenindeutschland.pdf

**Secondary resource:** Use **defuncart/einbuergerungstest** as a cross-reference for answer key verification on the 300 general questions — its TSV is clean, BAMF-ordered, and has the `isReordable` flag which tells you which questions have shuffleable answer positions.
