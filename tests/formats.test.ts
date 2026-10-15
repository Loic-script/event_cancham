import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { detecterFormat, tailleLisible } from "../src/lib/ressources/formats";
import { pdfSimple } from "../src/lib/ressources/pdf-simple";
import { convertirPdfEnPages } from "../src/lib/ressources/traitement";

const octets = (...parties: (string | number[])[]) => Buffer.concat(parties.map((p) => (typeof p === "string" ? Buffer.from(p, "latin1") : Buffer.from(p))));

describe("détection des formats par signature", () => {
  it("reconnaît un PDF même mal nommé", () => {
    assert.deepEqual(detecterFormat(octets("%PDF-1.7\n"), "photo.png"), { format: "pdf", extension: "pdf" });
  });

  it("accepte une archive zip seulement si elle est nommée .docx", () => {
    const zip = octets([0x50, 0x4b, 0x03, 0x04, 0x14, 0, 0, 0]);
    assert.deepEqual(detecterFormat(zip, "Rapport.DOCX"), { format: "docx", extension: "docx" });
    assert.equal(detecterFormat(zip, "archive.zip"), null);
    assert.equal(detecterFormat(zip, "classeur.xlsx"), null);
  });

  it("reconnaît une vidéo MP4 et refuse les images HEIC/AVIF", () => {
    assert.deepEqual(detecterFormat(octets([0, 0, 0, 0x20], "ftypisom", [0, 0, 2, 0]), "clip.mov"), { format: "video", extension: "mp4" });
    assert.equal(detecterFormat(octets([0, 0, 0, 0x18], "ftypheic", [0, 0, 0, 0]), "photo.heic"), null);
    assert.equal(detecterFormat(octets([0, 0, 0, 0x18], "ftypavif", [0, 0, 0, 0]), "photo.avif"), null);
  });

  it("reconnaît JPEG, PNG et WebP", () => {
    assert.equal(detecterFormat(octets([0xff, 0xd8, 0xff, 0xe0]), "a")?.extension, "jpg");
    assert.equal(detecterFormat(octets([0x89], "PNG", [0x0d, 0x0a, 0x1a, 0x0a]), "a")?.extension, "png");
    assert.equal(detecterFormat(octets("RIFF", [0x24, 0, 0, 0], "WEBPVP8 "), "a")?.extension, "webp");
  });

  it("refuse le reste, même avec une extension autorisée", () => {
    assert.equal(detecterFormat(octets("<html><body>"), "faux.pdf"), null);
    assert.equal(detecterFormat(octets("MZ\x90\x00"), "programme.mp4"), null);
    assert.equal(detecterFormat(octets("GIF89a"), "anim.png"), null);
    assert.equal(detecterFormat(octets(""), "vide.pdf"), null);
  });

  it("affiche la taille en français", () => {
    assert.equal(tailleLisible(2.4 * 1024 * 1024), "2,4 Mo");
    assert.equal(tailleLisible(512 * 1024), "512 Ko");
    assert.equal(tailleLisible(900), "900 o");
  });
});

describe("conversion d’un PDF en pages", () => {
  it("produit 20 images numérotées pour un PDF de 20 pages", { timeout: 120000 }, async () => {
    const dossier = await fs.mkdtemp(path.join(tmpdir(), "pdf-test-"));
    try {
      const pdf = path.join(dossier, "vingt.pdf");
      await fs.writeFile(pdf, pdfSimple(Array.from({ length: 20 }, (_, i) => ({ titre: `Page ${i + 1}`, lignes: ["Test de conversion"] }))));
      const n = await convertirPdfEnPages(pdf, path.join(dossier, "pages"));
      assert.equal(n, 20);
      const fichiers = (await fs.readdir(path.join(dossier, "pages"))).sort((a, b) => parseInt(a) - parseInt(b));
      assert.deepEqual(fichiers, Array.from({ length: 20 }, (_, i) => `${i + 1}.png`));
      const entete = (await fs.readFile(path.join(dossier, "pages", "20.png"))).subarray(0, 4);
      assert.deepEqual([...entete], [0x89, 0x50, 0x4e, 0x47]);
    } finally {
      await fs.rm(dossier, { recursive: true, force: true });
    }
  });
});
