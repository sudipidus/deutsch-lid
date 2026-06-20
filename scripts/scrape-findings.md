# BAMF "Leben in Deutschland" catalog — scraping mechanics (verified 2026-06-20)

Worked out live with a real browser against https://oet.bamf.de/ords/oetut/ (Oracle APEX app 534).

## Entry flow (APEX requires session state — never deep-link)

1. Direct navigation to `f?p=534:30` errors ("Leider ist ein Fehler aufgetreten"). You MUST start at `:1`.
2. `f?p=534:1` (Start): a `<select id="P30_ROWNUM">`-style Bundesland combobox with 16 options
   (Baden-Württemberg, Bayern, Berlin, Brandenburg, Bremen, Hamburg, Hessen,
   Mecklenburg-Vorpommern, Niedersachsen, Nordrhein-Westfalen, Rheinland-Pfalz,
   Saarland, Sachsen, Sachsen-Anhalt, Schleswig-Holstein, Thüringen). Select one,
   then click **"Zum Fragenkatalog"** → lands on `f?p=534:30` with a valid session.
3. The catalog is **310 questions = 300 general (1–300) + 10 state-specific (301–310)** for the
   chosen Bundesland. To collect all states: scrape 1–300 once, then re-enter per Bundesland
   and scrape 301–310 each (16 × 10 = 160 state questions total).

## Per-question DOM (page :30)

- Question number: text `Aufgabe N von 310` (in `td.RegionHeader`).
- **Stem is an IMAGE, not text.** `<img src="f?p=534:30::APPLICATION_PROCESS=show_pag_bild:::F534_PAG_THUMBNAIL,F534_PAG_BILD:,<ID>">`.
  The image ID changes per question (Q1→4619, Q2→4618). The German prompt is ONLY available as
  this image — there is no selectable stem text in the DOM.
- Answer options: each is a `<tr>` containing three cells:
  - `td[headers="RICHTIGE_ANTWORT"]` → a `<span>` reading "falsche Antwort =>" or, for the
    correct option, "richtige Antwort =>". (Visibility is toggled by JS on answer, but the text
    is in the DOM unconditionally.)
  - `td[headers="CHECKBOX"]` → `<input type="radio" name="f20" value="<dbId>">`. The CORRECT
    option's radio also has `id="FARBE"` and its `<td>`s carry `name="FARBE"`.
  - `td[headers="ANTWORT"]` → the option content: real text for most questions, or an
    `<img src=...PAG_BILD...>` for image-option questions (flags, coats of arms, ballots).
- **Robust extraction:** iterate `document.querySelectorAll('td[headers="ANTWORT"]')`; for each,
  `tr = td.closest('tr')`; text = `td.textContent.trim()` (or the option image src);
  correct = `/richtige/.test(tr.querySelector('td[headers="RICHTIGE_ANTWORT"] span').textContent)`.
  (Do NOT select rows by "tr that contains an f20 radio" — nested tables double-count.)
- The correct answer is in the DOM immediately; **no need to submit an answer.**

## Navigation

- Next: `htmldb_goSubmit('GET_NEXT_ID')` (the "nächste Aufgabe >" button) — verified advances 1→2.
- Previous: "< vorherige Aufgabe".
- Jump: `<select id="P30_ROWNUM">` (values 1..310) + `apex.submit('P30_ROWNUM')`. In testing the
  jump didn't reliably take from a scripted `.value` set; **sequential `GET_NEXT_ID` is the reliable path.**
- Form posts to `wwv_flow.accept?p_context=534:30:<n>`; with Playwright just drive the buttons and
  wait for navigation rather than reconstructing the POST.

## The consequence: stems (and some options) are images → text needs OCR

Pure scraping yields: correct answer (reliable), option TEXT (for text questions), state mapping,
and the stem/option IMAGES — but NOT the stem text, which the app needs for the per-word lookup.
To get tappable German text for stems (and image-options) you must either:
- (A) take stem+option TEXT from a reliable open dataset, using BAMF to verify answers/counts/state mapping; or
- (B) OCR the stem (and image-option) images with Claude vision (the pipeline already calls Claude) —
  download each PAG_BILD image, send to Claude with an image content block, transcribe the German text.
Storing stems as images only (no OCR) is NOT viable because it breaks "tap any word" on the stem.

## Scrape loop (when implemented in scripts/scrape.ts)

```
for state in [null /*general only, Q1-300*/, ...16 Bundesländer]:
  goto :1 ; select Bundesland ; click "Zum Fragenkatalog"
  for n in 1..310 (or 301..310 for the per-state pass):
    extract { number, options[text|imgSrc], correctIndex, stemImgSrc }
    download stemImg (+ any option imgs) to data/images/
    click "nächste Aufgabe >"
  → emit raw records; OCR pass (path B) or dataset merge (path A) fills stem/option text
  → normalizeQuestion → questions.base.json
```
