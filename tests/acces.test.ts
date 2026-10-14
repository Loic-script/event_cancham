import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decisionLecture, decisionVisibilite, dossierAccessible, membreAJour, peutAccederBibliotheque, statutHttp, type DossierLite, type Profil } from "../src/lib/ressources/acces";
import { indexer } from "../src/lib/ressources/dossiers";

const equipe: Profil = { equipe: true, membreId: null, aJour: false };
const membre: Profil = { equipe: false, membreId: "m1", aJour: true };
const nonAJour: Profil = { equipe: false, membreId: "m2", aJour: false };
const sansEntreprise: Profil = { equipe: false, membreId: null, aJour: false };
const visiteur: Profil = null;

const arbre: DossierLite[] = [
  { id: "racine", parentId: null, restreint: false },
  { id: "prive", parentId: null, restreint: true },
  { id: "prive-a", parentId: "prive", restreint: false },
  { id: "prive-a-b", parentId: "prive-a", restreint: false },
  { id: "prive-a-b-c", parentId: "prive-a-b", restreint: true },
];
const dossiers = indexer(arbre);
const aucun = new Set<string>();

describe("cotisation", () => {
  it("est à jour jusqu’à la date incluse", () => {
    const fin = new Date("2026-12-31T23:59:59Z");
    assert.equal(membreAJour(fin, new Date("2026-12-31T12:00:00Z")), true);
    assert.equal(membreAJour(fin, new Date("2027-01-01T00:00:01Z")), false);
    assert.equal(membreAJour(null), false);
  });
});

describe("accès à la bibliothèque", () => {
  it("ouvre la bibliothèque à l’équipe et aux membres à jour seulement", () => {
    assert.equal(peutAccederBibliotheque(equipe), true);
    assert.equal(peutAccederBibliotheque(membre), true);
    assert.equal(peutAccederBibliotheque(nonAJour), false);
    assert.equal(peutAccederBibliotheque(sansEntreprise), false);
    assert.equal(peutAccederBibliotheque(visiteur), false);
  });

  it("répond 403 au visiteur et au membre non à jour, même pour une ressource gratuite", () => {
    const r = { id: "r1", dossierId: null, type: "gratuit" as const };
    for (const p of [visiteur, nonAJour, sansEntreprise]) {
      const d = decisionLecture(p, r, dossiers, aucun, aucun);
      assert.equal(d, "interdit");
      assert.equal(statutHttp(d), 403);
    }
  });
});

describe("ressources gratuites et payantes", () => {
  const gratuite = { id: "g", dossierId: "racine", type: "gratuit" as const };
  const payante = { id: "p", dossierId: "racine", type: "payant" as const };

  it("laisse lire une ressource gratuite à tout membre à jour", () => {
    assert.equal(decisionLecture(membre, gratuite, dossiers, aucun, aucun), "ok");
  });

  it("montre une ressource payante sans la laisser lire tant que l’accès n’est pas ouvert", () => {
    assert.equal(decisionVisibilite(membre, payante, dossiers, aucun), "ok");
    const d = decisionLecture(membre, payante, dossiers, aucun, aucun);
    assert.equal(d, "payant");
    assert.equal(statutHttp(d), 403);
  });

  it("ouvre une ressource payante quand l’entreprise a un accès", () => {
    assert.equal(decisionLecture(membre, payante, dossiers, aucun, new Set(["p"])), "ok");
  });

  it("laisse l’équipe tout lire sans achat", () => {
    assert.equal(decisionLecture(equipe, payante, dossiers, aucun, aucun), "ok");
    assert.equal(decisionLecture(equipe, { id: "x", dossierId: "prive-a-b-c", type: "payant" }, dossiers, aucun, aucun), "ok");
  });
});

describe("héritage des dossiers restreints", () => {
  it("cache tout le sous-arbre d’un dossier restreint et répond 404", () => {
    for (const id of ["prive", "prive-a", "prive-a-b", "prive-a-b-c"]) {
      assert.equal(dossierAccessible(dossiers, id, aucun, false), false, id);
      const d = decisionLecture(membre, { id: "r", dossierId: id, type: "gratuit" }, dossiers, aucun, aucun);
      assert.equal(d, "introuvable");
      assert.equal(statutHttp(d), 404);
    }
  });

  it("ouvre les sous-dossiers à un membre autorisé sur le dossier restreint parent", () => {
    const acces = new Set(["prive"]);
    assert.equal(dossierAccessible(dossiers, "prive-a", acces, false), true);
    assert.equal(dossierAccessible(dossiers, "prive-a-b", acces, false), true);
    assert.equal(decisionLecture(membre, { id: "r", dossierId: "prive-a-b", type: "gratuit" }, dossiers, acces, aucun), "ok");
  });

  it("exige aussi l’accès à un sous-dossier lui-même restreint", () => {
    assert.equal(dossierAccessible(dossiers, "prive-a-b-c", new Set(["prive"]), false), false);
    assert.equal(dossierAccessible(dossiers, "prive-a-b-c", new Set(["prive", "prive-a-b-c"]), false), true);
  });

  it("refuse un accès au sous-dossier sans accès au parent restreint", () => {
    assert.equal(dossierAccessible(dossiers, "prive-a-b-c", new Set(["prive-a-b-c"]), false), false);
  });

  it("traite un dossier inconnu comme introuvable", () => {
    assert.equal(dossierAccessible(dossiers, "fantome", aucun, false), false);
  });
});
