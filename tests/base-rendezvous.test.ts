import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { baseDisponible, basePrisma, creerCompte, sansBase, supprimerComptes } from "./outils/base";

/** Rendez-vous B2B sur la base de test : réservation des emplacements et des personnes, validation, expiration. */
type Lib = typeof import("../src/lib/rendezvous");

let lib: Lib;
let aina = 0;
let bodo = 0;
let cela = 0;

before(async () => {
  if (!baseDisponible) return;
  lib = await import("../src/lib/rendezvous");
  aina = (await creerCompte("rdv", { firstName: "Aina" })).id;
  bodo = (await creerCompte("rdv", { firstName: "Bodo" })).id;
  cela = (await creerCompte("rdv", { firstName: "Cela" })).id;
});

after(async () => {
  if (!baseDisponible) return;
  await supprimerComptes([aina, bodo, cela]);
  await (await basePrisma()).$disconnect();
});

test("une demande réserve l'emplacement et occupe les deux personnes", { skip: sansBase }, async () => {
  assert.equal(await lib.creerDemande(aina, bodo, 0, 0), null);
  // Même créneau : Bodo est déjà pris, même sur un autre emplacement.
  assert.match((await lib.creerDemande(cela, bodo, 0, 1)) ?? "", /rendez-vous existe déjà/);
  // Même emplacement au même créneau, avec une autre personne libre.
  assert.match((await lib.creerDemande(cela, aina, 0, 0)) ?? "", /emplacement/);
  // Autre créneau : libre.
  assert.equal(await lib.creerDemande(cela, bodo, 1, 0), null);

  const dispo = await lib.disponibilites(cela, bodo);
  assert.deepEqual(dispo.pris.filter(([c]) => c === 0), [[0, 0]]);
  assert.ok(dispo.autreOccupe.includes(0) && dispo.autreOccupe.includes(1));
});

test("seul le destinataire valide, une seule fois", { skip: sansBase }, async () => {
  const [demande] = (await lib.rdvDe(aina)).filter((r) => r.avec.id === bodo);
  assert.equal(demande.etat, "attente");
  assert.match((await lib.confirmer(demande.id, aina)) ?? "", /n’existe plus/);
  assert.equal(await lib.confirmer(demande.id, bodo), null);
  assert.match((await lib.confirmer(demande.id, bodo)) ?? "", /déjà reçu une réponse/);
  assert.equal((await lib.rdvDe(aina)).find((r) => r.id === demande.id)?.etat, "confirme");
  // Le demandeur est prévenu de la validation.
  assert.ok((await lib.notificationsRdv(aina)).some((n) => n.genre === "confirme" && n.nom.startsWith("Bodo")));
});

test("une demande sans réponse expire après 48 heures et libère l'emplacement", { skip: sansBase }, async () => {
  const prisma = await basePrisma();
  const vieille = await prisma.rendezVousB2B.create({ data: { demandeurId: cela, destinataireId: aina, creneau: 2, lieu: 2, creeLe: new Date(Date.now() - lib.DELAI_REPONSE_MS - 60_000) } });
  assert.equal(lib.etatDe(vieille), "expire");
  assert.equal((await lib.rdvDe(cela)).find((r) => r.id === vieille.id)?.etat, "expire");
  // L'emplacement est de nouveau libre : Bodo peut le prendre avec Aina.
  assert.equal(await lib.creerDemande(bodo, aina, 2, 2), null);
  assert.match((await lib.confirmer(vieille.id, aina)) ?? "", /expiré/);
});
