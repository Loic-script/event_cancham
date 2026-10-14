import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { descendants, hauteur, indexer, profondeur, verifierCreation, verifierDeplacement } from "../src/lib/ressources/dossiers";

const chaine = (n: number, prefixe = "n") =>
  Array.from({ length: n }, (_, i) => ({ id: `${prefixe}${i + 1}`, parentId: i ? `${prefixe}${i}` : null, restreint: false }));

describe("arborescence des dossiers", () => {
  const d = indexer([...chaine(5), { id: "seul", parentId: null, restreint: false }, { id: "duo", parentId: null, restreint: false }, { id: "duo-2", parentId: "duo", restreint: false }]);

  it("mesure profondeur, hauteur et descendants", () => {
    assert.equal(profondeur(d, "n5"), 5);
    assert.equal(hauteur(d, "n1"), 5);
    assert.equal(hauteur(d, "seul"), 1);
    assert.deepEqual([...descendants(d, "n3")].sort(), ["n4", "n5"]);
  });

  it("refuse de ranger un dossier dans lui-même ou sa descendance", () => {
    assert.equal(verifierDeplacement(d, "n2", "n2").ok, false);
    assert.equal(verifierDeplacement(d, "n2", "n4").ok, false);
  });

  it("refuse de dépasser 5 niveaux", () => {
    assert.equal(verifierDeplacement(d, "seul", "n5").ok, false);
    assert.equal(verifierDeplacement(d, "duo", "n4").ok, false);
    assert.equal(verifierDeplacement(d, "duo", "n3").ok, true);
    assert.equal(verifierCreation(d, "n5").ok, false);
    assert.equal(verifierCreation(d, "n4").ok, true);
  });

  it("accepte un déplacement valide et la remontée à la racine", () => {
    assert.equal(verifierDeplacement(d, "seul", "n2").ok, true);
    assert.equal(verifierDeplacement(d, "n3", null).ok, true);
  });
});
