import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";
import JSZip from "jszip";
import { QuestionsSchema, type Question } from "../src/lib/schemas.js";

// Builds a flashcard-style EPUB of every question: a front page with the
// question and its options, then a back page with the answer, the bilingual
// explanation, and the deeper background. Rebuild anytime with `npm run
// build:epub`. Output ships in public/ so GitHub Pages can serve it.
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const dataDir = join(root, "data");
const publicDir = join(root, "public");
const OUT = join(publicDir, "leben-in-deutschland.epub");
const LETTERS = ["A", "B", "C", "D"];

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const seq = (n: number) => String(n).padStart(4, "0");

function label(q: Question): string {
  return q.category === "state" && q.state ? `${esc(q.state)} · Landesfrage` : "Allgemeine Frage";
}

function page(title: string, body: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="de" lang="de">
<head><meta charset="utf-8"/><title>${esc(title)}</title><link rel="stylesheet" href="style.css"/></head>
<body>${body}</body>
</html>`;
}

function frontPage(q: Question, n: number, imageHref: string | null): string {
  const tr = q.translationEn;
  const opts = q.options
    .map((opt, i) => {
      const en = tr?.options[i] ? `<span class="en">${esc(tr.options[i])}</span>` : "";
      return `<li><span class="letter">${LETTERS[i]}</span><span class="opt">${esc(opt)}${en}</span></li>`;
    })
    .join("");
  const img = imageHref ? `<p class="img"><img src="${imageHref}" alt=""/></p>` : "";
  const trQ = tr ? `<p class="en q-en">${esc(tr.question)}</p>` : "";
  return page(`Frage ${n}`, `
    <div class="tag">${label(q)} · Frage ${n} / 460</div>
    <h1 class="q">${esc(q.question)}</h1>
    ${trQ}
    ${img}
    <ol class="options">${opts}</ol>
    <p class="flip">→ Antwort auf der nächsten Seite</p>`);
}

function backPage(q: Question, n: number): string {
  const opts = q.options
    .map((opt, i) => {
      const correct = i === q.answerIndex;
      return `<li class="${correct ? "correct" : ""}"><span class="letter">${LETTERS[i]}</span>` +
        `<span class="opt">${esc(opt)}</span>${correct ? '<span class="check">✓</span>' : ""}</li>`;
    })
    .join("");
  const deExpl = q.explanationDe
    ? `<p><span class="k">Erklärung:</span> ${esc(q.explanationDe)}</p>`
    : "";
  const enExpl = `<p class="${q.explanationDe ? "en" : ""}"><span class="k">${q.explanationDe ? "Explanation:" : "Erklärung:"}</span> ${esc(q.explanation)}</p>`;
  const bg = q.background
    ? `<div class="bg"><p><span class="k">Hintergrund:</span> ${esc(q.background.de)}</p>` +
      `<p class="en"><span class="k">Background:</span> ${esc(q.background.en)}</p></div>`
    : "";
  return page(`Antwort ${n}`, `
    <div class="tag">${label(q)} · Antwort ${n} / 460</div>
    <h2 class="a">Richtige Antwort: ${LETTERS[q.answerIndex]}</h2>
    <ol class="options answer">${opts}</ol>
    <div class="expl">${deExpl}${enExpl}${bg}</div>`);
}

const CSS = `
body { font-family: Georgia, "Times New Roman", serif; line-height: 1.5; color: #1c1917; margin: 1em; }
.tag { font-size: 0.75em; letter-spacing: 0.04em; text-transform: uppercase; color: #78716c; margin-bottom: 0.6em; }
h1.q { font-size: 1.3em; line-height: 1.3; margin: 0 0 0.3em; }
h2.a { font-size: 1.15em; color: #15803d; margin: 0 0 0.6em; }
.en { color: #78716c; font-style: italic; }
.q-en { margin-top: 0; font-size: 0.95em; }
.img img { max-width: 100%; height: auto; border: 1px solid #e7e5e4; border-radius: 6px; }
ol.options { list-style: none; padding: 0; margin: 0.6em 0; }
ol.options li { display: flex; align-items: baseline; gap: 0.5em; border: 1px solid #e7e5e4; border-radius: 10px; padding: 0.5em 0.7em; margin-bottom: 0.4em; }
ol.options .letter { font-weight: bold; color: #78716c; min-width: 1.2em; }
ol.options .opt { flex: 1; }
ol.options .en { display: block; font-size: 0.85em; }
ol.answer li.correct { border-color: #16a34a; background: #f0fdf4; }
ol.answer .check { color: #16a34a; font-weight: bold; }
.flip { color: #a8a29e; font-style: italic; margin-top: 1.2em; font-size: 0.9em; }
.expl { margin-top: 0.8em; }
.expl .k { font-weight: bold; }
.expl .en { color: #57534e; font-size: 0.95em; }
.bg { margin-top: 0.7em; border-top: 1px solid #e7e5e4; padding-top: 0.6em; }
`;

async function main() {
  const questions = QuestionsSchema.parse(
    JSON.parse(await readFile(join(dataDir, "questions.json"), "utf8")),
  );

  const zip = new JSZip();
  // mimetype must be the first entry and stored uncompressed.
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="utf-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`,
  );

  const oebps = zip.folder("OEBPS")!;
  oebps.file("style.css", CSS);

  const manifestItems: string[] = [];
  const spineItems: string[] = [];
  const navItems: string[] = [];
  const images = new Map<string, string>(); // id -> href

  questions.forEach((q, idx) => {
    const n = idx + 1;
    const id = seq(n);

    let imageHref: string | null = null;
    if (q.image) {
      const file = basename(q.image);
      const imgId = `img-${file.replace(/[^a-z0-9]/gi, "-")}`;
      imageHref = file;
      images.set(imgId, file);
    }

    const front = `q-${id}-front.xhtml`;
    const back = `q-${id}-back.xhtml`;
    oebps.file(front, frontPage(q, n, imageHref));
    oebps.file(back, backPage(q, n));

    manifestItems.push(`<item id="f-${id}" href="${front}" media-type="application/xhtml+xml"/>`);
    manifestItems.push(`<item id="b-${id}" href="${back}" media-type="application/xhtml+xml"/>`);
    spineItems.push(`<itemref idref="f-${id}"/>`);
    spineItems.push(`<itemref idref="b-${id}"/>`);
    navItems.push(`<li><a href="${front}">Frage ${n} — ${esc(label(q).replace(/<[^>]*>/g, ""))}</a></li>`);
  });

  // Embed each referenced image once.
  for (const [imgId, file] of images) {
    const bytes = await readFile(join(publicDir, "images", file));
    oebps.file(file, bytes);
    manifestItems.push(`<item id="${imgId}" href="${file}" media-type="image/png"/>`);
  }

  const nav = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="de" lang="de">
<head><meta charset="utf-8"/><title>Inhalt</title></head>
<body><nav epub:type="toc" id="toc"><h1>Inhalt</h1><ol>${navItems.join("")}</ol></nav></body>
</html>`;
  oebps.file("nav.xhtml", nav);

  const opf = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="book-id">urn:uuid:leben-in-deutschland-quiz</dc:identifier>
    <dc:title>Leben in Deutschland — Alle Fragen mit Erklärungen</dc:title>
    <dc:language>de</dc:language>
    <dc:creator>deutsch-lid</dc:creator>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, "Z")}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="css" href="style.css" media-type="text/css"/>
    ${manifestItems.join("\n    ")}
  </manifest>
  <spine>
    <itemref idref="nav" linear="no"/>
    ${spineItems.join("\n    ")}
  </spine>
</package>`;
  oebps.file("content.opf", opf);

  const buf = await zip.generateAsync({ type: "nodebuffer", mimeType: "application/epub+zip" });
  await writeFile(OUT, buf);
  const withBg = questions.filter((q) => q.background).length;
  console.log(`Wrote ${OUT} — ${questions.length} questions (${withBg} with background), ${images.size} images, ${(buf.length / 1024).toFixed(0)} KiB`);
}

main().catch((e) => { console.error(e); process.exit(1); });
