# Leben in Deutschland — MCQ Quiz with Word Lookups

**Date:** 2026-06-20
**Status:** Approved design

## Goal

A static, installable web app for studying the German "Leben in Deutschland" /
Einbürgerungstest. It presents the official multiple-choice question catalog,
lets the user tap any word to see its etymology, meaning, and context, shows an
AI-generated explanation for every question, and can simulate the real test
(33 questions, lookups disabled, score revealed at the end). Usable from a phone,
fully offline, no backend.

## Scope

- **Questions:** the full official catalog — **300 general questions + 10 per
  Bundesland × 16 states (160 state questions)**. The user picks their Bundesland;
  the test simulation draws 30 general + 3 from the chosen state (33 total, real
  test format).
- **Word lookups:** every unique German word appearing in any question or answer
  option gets a dictionary entry (etymology, meaning, context, part of speech,
  article for nouns). "Every word, everywhere."
- **Per-question explanations:** every question gets a short AI-generated
  explanation (why the correct answer is right + civic/cultural background).
- **Out of scope:** user accounts, any backend/server, runtime API calls,
  spaced-repetition scheduling, multi-language UI.

## Architecture

A single repository with two independent halves communicating through static JSON:

1. **Data pipeline** (`/scripts`, TypeScript/Node) — a one-time, re-runnable build
   process that sources the questions and uses the Claude API to generate word
   entries and explanations, emitting validated JSON.
2. **Web app** (`/src`, React + Vite + Tailwind, deployed to GitHub Pages as a
   PWA) — consumes the JSON. No server, no runtime API calls, works offline.

**Shared tokenizer:** a single module (`/src/lib/tokenizer.ts`) is used by *both*
halves. The pipeline uses it to extract the words to generate entries for; the app
uses the identical logic to split text into tappable words. Identical tokenization
on both sides guarantees every tappable word resolves to an entry.

```
/data
  questions.json        # final, validated
  words.json            # word dictionary (keyed by lemma, with alias map)
  /images               # question images (flags, ballots, coats of arms)
  /raw                  # sourced raw + pipeline manifest (gitignored intermediate)
/scripts                # pipeline stages
/src
  /lib/tokenizer.ts     # SHARED between pipeline and app
  /components
  /routes
  /lib                  # data loading, store, helpers
/public                 # PWA manifest, icons, service worker
```

## Data model

### `questions.json`

Array of:

```jsonc
{
  "id": 21,
  "category": "general",          // "general" | "state"
  "state": null,                  // e.g. "BW" for state questions, null for general
  "question": "Was ist mit der deutschen Wiedervereinigung gemeint?",
  "image": null,                  // or "images/q21.png"
  "options": ["...", "...", "...", "..."],
  "answerIndex": 2,               // 0-based index of correct option
  "explanation": "AI-generated: why correct + civic background"
}
```

### `words.json`

Deduped dictionary keyed by **lemma**, with a surface-form alias map so inflected
words resolve to their base form:

```jsonc
{
  "aliases": { "bundesländer": "Bundesland", "ist": "sein" },
  "entries": {
    "Bundesland": {
      "pos": "noun",
      "article": "das",           // nouns only; null otherwise
      "meaning": "...",
      "etymology": "...",
      "context": "..."            // how the word is used / its relevance
    }
  }
}
```

The AI performs lemmatization during generation (given the surface form + its
sentence), so one meaningful entry is generated per lemma rather than per inflected
form. Alias keys are normalized (lowercased, punctuation stripped) to match the
tokenizer's output.

## Data pipeline (Phase 1)

Sequential, idempotent stages. Each writes intermediate output to `/data/raw` and
records progress in a manifest so a re-run resumes rather than redoing completed
work. API errors are retried; the final emit is gated on schema validation.

1. **Source** — import an open dataset of the LiD catalog if a reliable one is
   found; otherwise scrape the official BAMF APEX tool with Playwright. Captures
   question text, options, correct answer, and **images** (several questions are
   image-based: flags, coats of arms, ballot papers).
2. **Tokenize** — extract all unique word tokens across every question + option
   using the shared tokenizer.
3. **Generate words** — batched Claude API calls producing lemma + etymology +
   meaning + context + part of speech + article. Dedupe by lemma; build the alias
   map from surface form → lemma.
4. **Generate explanations** — one Claude call per question.
5. **Validate & emit** — zod schema validation of the assembled data; fail the
   build on any malformed record. Emit final `questions.json` and `words.json`.

## Web app (Phases 2–3)

### Modes (routes), all sharing a `QuestionCard`

- **Study** — browse all questions. Correct answer highlighted, explanation
  visible, every word tappable for its popover. The "learn" surface.
- **Practice quiz** — one question at a time, immediate right/wrong feedback;
  explanation + lookups available after answering. Shuffle, filter by
  state/category. Progress saved in `localStorage`.
- **Test simulation** — draws 30 general + 3 from the chosen Bundesland (33 total).
  **Lookups disabled, explanations hidden, no per-question feedback.** Optional
  60-minute timer (real test length). Submit → score with pass/fail at
  **≥17 correct**, then a review screen that unlocks explanations + lookups for
  every question.

### Key components

- **`TokenizedText`** — splits text via the shared tokenizer and renders word
  tokens as tappable spans. An `interactive` prop, set `false` in test mode,
  renders plain non-tappable text. This single switch enforces "no lookups during
  the test."
- **`WordPopover`** — on tap (click/long-press on desktop), resolves token →
  alias map → lemma → entry and shows meaning/etymology/context/article. Missing
  entry → graceful "no entry" state.
- **`OptionList`**, **`Explanation`**, **`TestRunner`** (owns question draw,
  lookup lock, and scoring), **`ScoreSummary`**, **`ResultsReview`**.

### State & persistence

React state plus a small Zustand store. `localStorage` holds: chosen Bundesland,
practice progress, and past test scores. No accounts, no backend.

### PWA

`vite-plugin-pwa` makes the app installable on a phone home screen with full
offline use (JSON + images cached). Deployed to GitHub Pages.

## Mobile interaction

No right-click on phones: the lookup gesture is **tap a word → popover** (click or
long-press on desktop). Test mode disables this via the `interactive=false` switch
on `TokenizedText`.

## Testing (TDD throughout)

- **Pipeline:** tokenizer, lemma/alias mapping, dedup, zod schema validation.
- **App:** `TokenizedText` (interactive vs locked), popover resolution including
  inflected forms via the alias map, and the **test-mode scoring + 17-to-pass
  logic** — the highest-value tests, being the core of the simulation.

## Error handling

- **Pipeline:** retries API errors, resumes from its manifest, and gates the final
  emit on validation.
- **App:** degrades gracefully on a missing word entry or missing image. Static
  data means the app has almost no runtime failure surface.

## Phasing

1. **Phase 1 — Data:** build and run the pipeline; produce final, validated
   `questions.json` and `words.json` (all questions, all word entries, all
   explanations).
2. **Phase 2 — App core:** Study + Practice modes with word lookups and
   explanations, against the real data.
3. **Phase 3 — Test mode + PWA:** test simulation (lock, draw, score, review),
   Bundesland selection, PWA install/offline polish, GitHub Pages deploy.
