import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { baseDisponible, basePrisma, creerCompte, sansBase, supprimerComptes } from "./outils/base";

/** Billets et scanner sur la base de test : codes uniques, verdicts, entrées enregistrées. */
type Lib = typeof import("../src/lib/billets");

let lib: Lib;
let admin = 0;
let paye = { id: 0, codeBillet: "" };
let impaye = { id: 0, codeBillet: "" };
let enAttente = { id: 0, codeBillet: "" };

before(async () => {
  if (!baseDisponible) return;
  lib = await import("../src/lib/billets");
  admin = (await creerCompte("billet", { acces: "ADMIN" })).id;
  paye = await creerCompte("billet", { firstName: "Payé", billetPaye: true });
  impaye = await creerCompte("billet", { firstName: "Impayé" });
  enAttente = await creerCompte("billet", { firstName: "Attente", statut: "EN_ATTENTE", billetPaye: true });
});

after(async () => {
  if (!baseDisponible) return;
  await supprimerComptes([admin, paye.id, impaye.id, enAttente.id]);
  await (await basePrisma()).$disconnect();
});

test("chaque compte reçoit un code de billet unique, impossible à deviner", { skip: sansBase }, async () => {
  assert.match(paye.codeBillet, /^TRV26-[0-9A-F]{8}$/);
  assert.notEqual(paye.codeBillet, impaye.codeBillet);
  assert.equal(lib.normaliserCode(` ${paye.codeBillet.toLowerCase()} `), paye.codeBillet);
});

test("verdicts du scanner : inconnu, en attente, validé, déjà scanné", { skip: sansBase }, async () => {
  assert.equal((await lib.scanner("TRV26-00000000", admin)).etat, "inconnu");
  // Compte pas encore validé par l'équipe : pas de billet.
  assert.equal((await lib.scanner(enAttente.codeBillet, admin)).etat, "inconnu");
  assert.equal((await lib.scanner(impaye.codeBillet, admin)).etat, "attente");

  const ok = await lib.scanner(` ${paye.codeBillet.toLowerCase()} `, admin);
  assert.equal(ok.etat, "ok");
  assert.equal(ok.nom, "Payé billet");
  const deja = await lib.scanner(paye.codeBillet, admin);
  assert.equal(deja.etat, "deja");
  assert.ok(deja.quand && deja.quand <= Date.now());
});

test("paiement reçu à l'entrée : billet marqué payé et entrée enregistrée", { skip: sansBase }, async () => {
  const verdict = await lib.encaisser(impaye.id, admin);
  assert.equal(verdict.etat, "ok");
  const prisma = await basePrisma();
  assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: impaye.id }, select: { billetPaye: true } })).billetPaye, true);
  const entrees = await lib.entreesGala();
  assert.ok(entrees.some((e) => e.userId === paye.id) && entrees.some((e) => e.userId === impaye.id));
  assert.ok((await lib.nombreInscrits()) >= 3);
});
