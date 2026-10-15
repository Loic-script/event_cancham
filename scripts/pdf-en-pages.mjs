import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const [, , entree, sortie, dpiTexte] = process.argv;

if (!entree || !sortie) {
  console.error("Usage : node scripts/pdf-en-pages.mjs <fichier.pdf> <dossier-sortie> [dpi]");
  process.exit(2);
}

const dpi = Number(dpiTexte || 110);
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const { createCanvas } = require("@napi-rs/canvas");
const racine = path.dirname(require.resolve("pdfjs-dist/package.json"));
const dossier = (nom) => path.join(racine, nom).split(path.sep).join("/") + "/";

const tache = pdfjs.getDocument({
  data: new Uint8Array(readFileSync(entree)),
  standardFontDataUrl: dossier("standard_fonts"),
  cMapUrl: dossier("cmaps"),
  cMapPacked: true,
  isEvalSupported: false,
  verbosity: 0,
});

try {
  const doc = await tache.promise;
  mkdirSync(sortie, { recursive: true });
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const vue = page.getViewport({ scale: dpi / 72 });
    const canvas = createCanvas(Math.ceil(vue.width), Math.ceil(vue.height));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, canvas, viewport: vue }).promise;
    writeFileSync(path.join(sortie, `${i}.png`), canvas.toBuffer("image/png"));
    page.cleanup();
  }
  process.stdout.write(JSON.stringify({ pages: doc.numPages }));
} catch (e) {
  console.error(e instanceof Error ? e.message : String(e));
  process.exitCode = 1;
} finally {
  await tache.destroy();
}
