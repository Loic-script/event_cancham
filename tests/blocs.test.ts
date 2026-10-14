import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dureeLecture, fichiersUtilises, integration, lienSur, nettoyerBlocs, premierePhoto } from "../src/lib/ressources/blocs";

describe("nettoyage des blocs du format Page", () => {
  it("garde une structure JSON propre et rejette ce qui n’est pas attendu", () => {
    const blocs = nettoyerBlocs([
      { id: "titre1", type: "titre", niveau: 3, texte: "  Programme  ", align: "center", couleur: "#D9560C" },
      { id: "titre2", type: "titre", texte: "" },
      { id: "script1", type: "script", contenu: "<script>alert(1)</script>" },
      {
        id: "texte1",
        type: "texte",
        paragraphes: [
          { type: "p", align: "right", items: [[{ t: "Bonjour ", b: true }, { t: "monde", couleur: "red", lien: "javascript:alert(1)", taille: "énorme" }]] },
          { type: "ul", items: [[{ t: "Un" }], [{ t: "Deux", s: true }], []] },
        ],
      },
      { id: "photo1", type: "photo", fichier: "../../etc/passwd", legende: "Salle" },
      { id: "video1", type: "video", url: "https://youtu.be/dQw4w9WgXcQ" },
      { id: "video2", type: "video", url: "https://exemple.com/video" },
    ]);
    assert.equal(blocs.length, 5);
    assert.deepEqual(blocs[0], { id: "titre1", type: "titre", niveau: 3, texte: "Programme", align: "center", couleur: "#d9560c" });
    const texte = blocs[1];
    assert.equal(texte.type, "texte");
    if (texte.type === "texte") {
      assert.deepEqual(texte.paragraphes[0], { type: "p", align: "right", items: [[{ t: "Bonjour ", b: true }, { t: "monde" }]] });
      assert.deepEqual(texte.paragraphes[1].items, [[{ t: "Un" }], [{ t: "Deux", s: true }]]);
    }
    assert.deepEqual(blocs[2], { id: "photo1", type: "photo", fichier: null, legende: "Salle" });
    assert.equal(blocs[3].type === "video" && blocs[3].url, "https://youtu.be/dQw4w9WgXcQ");
    assert.equal(blocs[4].type === "video" && blocs[4].url, null);
  });

  it("recense les fichiers utilisés et la première photo", () => {
    const blocs = nettoyerBlocs([
      { id: "bloc-a1", type: "photo", fichier: "0b6c1f0e-1111-2222-3333-444455556666.webp", legende: "" },
      { id: "bloc-a2", type: "video", fichier: "0b6c1f0e-aaaa-bbbb-cccc-ddddeeeeffff.mp4" },
      { id: "bloc-a3", type: "photo", fichier: "image.png", legende: "" },
    ]);
    assert.deepEqual([...fichiersUtilises(blocs)].sort(), ["0b6c1f0e-1111-2222-3333-444455556666.webp", "0b6c1f0e-aaaa-bbbb-cccc-ddddeeeeffff.mp4"]);
    assert.equal(premierePhoto(blocs), "0b6c1f0e-1111-2222-3333-444455556666.webp");
  });

  it("estime la durée de lecture", () => {
    const mots = Array.from({ length: 450 }, () => "mot").join(" ");
    assert.equal(dureeLecture(nettoyerBlocs([{ id: "bloc-z1", type: "texte", paragraphes: [{ type: "p", items: [[{ t: mots }]] }] }])), "2 min de lecture");
    assert.equal(dureeLecture([]), "1 min de lecture");
  });
});

describe("liens et vidéos intégrées", () => {
  it("n’accepte que des liens web ou mailto", () => {
    assert.equal(lienSur("cancham.mg"), "https://cancham.mg/");
    assert.equal(lienSur("mailto:contact@cancham.mg"), "mailto:contact@cancham.mg");
    assert.equal(lienSur("javascript:alert(1)"), undefined);
    assert.equal(lienSur("data:text/html,x"), undefined);
  });

  it("intègre YouTube sans cookie, Vimeo et Google Drive", () => {
    assert.equal(integration("https://www.youtube.com/watch?v=dQw4w9WgXcQ")?.src, "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1");
    assert.equal(integration("youtu.be/dQw4w9WgXcQ")?.fournisseur, "YouTube");
    assert.equal(integration("https://vimeo.com/76979871")?.src, "https://player.vimeo.com/video/76979871?dnt=1");
    assert.equal(integration("https://drive.google.com/file/d/1AbCdEfGhIjKlMn/view?usp=sharing")?.src, "https://drive.google.com/file/d/1AbCdEfGhIjKlMn/preview");
    assert.equal(integration("https://exemple.com/video.mp4"), null);
  });
});
