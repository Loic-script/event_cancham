import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { baseDisponible, basePrisma, creerCompte, sansBase, supprimerComptes } from "./outils/base";

/** Paiements sur la base de test : tentative reprise, conclusion une seule fois, échec et montant différent sans effet, page après connexion. */
type Lib = typeof import("../src/lib/paiements");
type Parcours = typeof import("../src/lib/parcours");

let lib: Lib;
let parcours: Parcours;
const ids: number[] = [];

before(async () => {
  if (!baseDisponible) return;
  lib = await import("../src/lib/paiements");
  parcours = await import("../src/lib/parcours");
});

after(async () => {
  if (!baseDisponible) return;
  const prisma = await basePrisma();
  const emails = (await prisma.user.findMany({ where: { id: { in: ids } }, select: { email: true } })).map((u) => u.email);
  await prisma.journal.deleteMany({ where: { OR: [{ acteur: { in: emails } }, { acteur: { in: ids.map((id) => `membre:${id}`) } }] } });
  await supprimerComptes(ids);
  await prisma.$disconnect();
});

async function enAttente() {
  const u = await creerCompte("paiements", { statut: "EN_ATTENTE" });
  ids.push(u.id);
  return u;
}

test("référence LT-2026-XXXXXX sans caractères ambigus", { skip: sansBase }, () => {
  for (let i = 0; i < 50; i++) {
    const r = lib.nouvelleReference();
    assert.equal(lib.referenceValide(r), true, r);
    assert.doesNotMatch(r.slice(lib.PREFIXE_REFERENCE.length), /[01OIL]/);
  }
  assert.equal(lib.referenceValide("LT-2026-ABC23"), false);
  assert.equal(lib.referenceValide("LT-2026-abc234"), false);
  assert.equal(lib.formatAriary(500000), "500 000 Ar");
});

test("la tentative en cours est reprise pour le même moyen, une autre est créée pour un autre moyen", { skip: sansBase }, async () => {
  const u = await enAttente();
  const t1 = await lib.tentativePour(u.id, "mvola");
  const t2 = await lib.tentativePour(u.id, "mvola");
  assert.equal(t2.id, t1.id);
  assert.equal(t1.statut, "en_cours");
  assert.equal(t1.montant, lib.montantBillet());
  const t3 = await lib.tentativePour(u.id, "carte");
  assert.notEqual(t3.id, t1.id);
});

test("paiement réussi : accès ouvert une seule fois, même si la notification et le retour concluent tous deux", { skip: sansBase }, async () => {
  const prisma = await basePrisma();
  const u = await enAttente();
  const t = await lib.tentativePour(u.id, "carte");
  const resultat = { etat: "reussi" as const, transaction: "TX-1", notification: { etat: "SUCCESS" }, montantAriary: t.montant };
  assert.equal(await lib.conclurePaiement(t.reference, resultat), "reussi");
  const apres = await prisma.user.findUniqueOrThrow({ where: { id: u.id } });
  assert.equal(apres.statut, "ACTIF");
  assert.equal(apres.billetPaye, true);
  assert.equal(apres.paiementReference, t.reference);
  assert.ok(apres.payeLe);
  const p = await prisma.paiement.findUniqueOrThrow({ where: { reference: t.reference } });
  assert.equal(p.statut, "reussi");
  assert.equal(p.transaction, "TX-1");
  assert.ok(p.regleLe);

  // Deuxième conclusion (page de retour après la notification) : rien ne change, pas de second journal.
  assert.equal(await lib.conclurePaiement(t.reference, resultat), "deja");
  assert.equal(await prisma.journal.count({ where: { acteur: u.email, action: "paiement_reussi" } }), 1);
  // Même un « échec » reçu ensuite ne retire pas l'accès.
  assert.equal(await lib.conclurePaiement(t.reference, { ...resultat, etat: "echoue" }), "deja");
  assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: u.id } })).statut, "ACTIF");
  // Après le paiement, la tentative n'est plus reprise : une nouvelle serait créée.
  assert.equal(await lib.verifierAuRetour(await prisma.paiement.findUniqueOrThrow({ where: { reference: t.reference } })), "deja");
});

test("paiement échoué : tentative close, compte toujours en attente, nouvelle tentative possible", { skip: sansBase }, async () => {
  const prisma = await basePrisma();
  const u = await enAttente();
  const t = await lib.tentativePour(u.id, "orange_money");
  assert.equal(await lib.conclurePaiement(t.reference, { etat: "echoue", notification: { etat: "FAILED" }, montantAriary: t.montant }), "echoue");
  assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: u.id } })).statut, "EN_ATTENTE");
  assert.equal((await prisma.paiement.findUniqueOrThrow({ where: { reference: t.reference } })).statut, "echoue");
  const t2 = await lib.tentativePour(u.id, "orange_money");
  assert.notEqual(t2.id, t.id);
  // Un « réussi » tardif sur la tentative close n'ouvre rien.
  assert.equal(await lib.conclurePaiement(t.reference, { etat: "reussi", montantAriary: t.montant }), "deja");
  assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: u.id } })).statut, "EN_ATTENTE");
});

test("montant différent : rien n'est ouvert, la tentative est close et journalisée", { skip: sansBase }, async () => {
  const prisma = await basePrisma();
  const u = await enAttente();
  const t = await lib.tentativePour(u.id, "airtel_money");
  assert.equal(await lib.conclurePaiement(t.reference, { etat: "reussi", notification: { etat: "SUCCESS", montant: 1000 }, montantAriary: 1000 }), "montant");
  assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: u.id } })).statut, "EN_ATTENTE");
  assert.equal((await prisma.paiement.findUniqueOrThrow({ where: { reference: t.reference } })).statut, "echoue");
  assert.equal(await prisma.journal.count({ where: { acteur: `membre:${u.id}`, action: "paiement_montant_different" } }), 1);
  // Référence inconnue : rien.
  assert.equal(await lib.conclurePaiement("LT-2026-ZZZZZZ", { etat: "reussi", montantAriary: 500000 }), "deja");
  // En cours : rien non plus.
  const t2 = await lib.tentativePour(u.id, "airtel_money");
  assert.equal(await lib.conclurePaiement(t2.reference, { etat: "en_cours", montantAriary: null }), "en_cours");
  assert.equal((await prisma.paiement.findUniqueOrThrow({ where: { reference: t2.reference } })).statut, "en_cours");
});

test("la tentative n'est visible que par son membre", { skip: sansBase }, async () => {
  const a = await enAttente();
  const b = await enAttente();
  const t = await lib.tentativePour(a.id, "mvola");
  assert.ok(await lib.tentativeDuMembre(a.id, t.reference));
  assert.equal(await lib.tentativeDuMembre(b.id, t.reference), null);
});

test("après la connexion : compte en attente → /paiement d'abord ; payé → parcours d'accueil, puis l'espace", { skip: sansBase }, async () => {
  const prisma = await basePrisma();
  const u = await enAttente();
  assert.equal(await parcours.pageApresConnexion(u.id), "/paiement");
  const t = await lib.tentativePour(u.id, "carte");
  await lib.conclurePaiement(t.reference, { etat: "reussi", montantAriary: t.montant });
  assert.equal(await parcours.pageApresConnexion(u.id), "/bienvenue");
  await prisma.parcoursAccueil.create({ data: { userId: u.id, termineLe: new Date() } });
  assert.equal(await parcours.pageApresConnexion(u.id), "/");
});
