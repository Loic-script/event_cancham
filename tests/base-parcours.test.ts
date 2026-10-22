import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { baseDisponible, basePrisma, creerCompte, sansBase, supprimerComptes } from "./outils/base";

/** Parcours d'accueil sur la base de test : étapes faites ou passées, page après la connexion. */
type Lib = typeof import("../src/lib/parcours");

let lib: Lib;
const ids: number[] = [];

before(async () => {
  if (!baseDisponible) return;
  lib = await import("../src/lib/parcours");
});

after(async () => {
  if (!baseDisponible) return;
  await supprimerComptes(ids);
  await (await basePrisma()).$disconnect();
});

test("compte validé : quatre étapes, parcours à la connexion tant qu'il n'est pas terminé", { skip: sansBase }, async () => {
  const prisma = await basePrisma();
  const u = await creerCompte("parcours");
  ids.push(u.id);

  let etat = await lib.etatParcours(u.id);
  assert.deepEqual(etat.etapes.map((e) => e.id), ["photo", "entreprise", "pitch", "tombola"]);
  assert.equal(etat.commence, false);
  assert.equal(etat.restantes, 4);
  assert.equal(await lib.pageApresConnexion(u.id), "/bienvenue");
  assert.equal(await lib.pageApresConnexion(u.id, "/annuaire"), "/bienvenue?next=%2Fannuaire");

  // Les étapes faites se lisent dans les données du compte ; une étape passée est gardée dans le parcours.
  await prisma.user.update({ where: { id: u.id }, data: { photo: "/api/profil/photos/0123456789abcdef0123456789abcdef", sector: "Conseil" } });
  await prisma.participationDefi.create({ data: { defi: "pitch", userId: u.id, lien: "https://youtu.be/x" } });
  await prisma.parcoursAccueil.create({ data: { userId: u.id, passees: ["tombola"] } });
  etat = await lib.etatParcours(u.id);
  assert.deepEqual(etat.etapes.map((e) => [e.fait, e.passee]), [[true, false], [true, false], [true, false], [false, true]]);
  assert.equal(etat.restantes, 0);
  assert.equal(etat.aCompleter, 1);
  assert.equal(etat.commence, true);
  // Pas encore terminé : le parcours s'ouvre toujours à la connexion.
  assert.equal(await lib.pageApresConnexion(u.id), "/bienvenue");

  await prisma.parcoursAccueil.update({ where: { userId: u.id }, data: { termineLe: new Date() } });
  assert.equal((await lib.etatParcours(u.id)).termine, true);
  assert.equal(await lib.pageApresConnexion(u.id), "/");
  assert.equal(await lib.pageApresConnexion(u.id, "/annuaire"), "/annuaire");
});

test("compte en attente : profil à compléter, parcours, puis règlement du billet", { skip: sansBase }, async () => {
  const prisma = await basePrisma();
  const u = await creerCompte("parcours", { statut: "EN_ATTENTE", phone: null });
  ids.push(u.id);
  assert.equal(await lib.pageApresConnexion(u.id), "/inscription/completer");

  await prisma.user.update({ where: { id: u.id }, data: { phone: "+261340000000" } });
  assert.equal(await lib.pageApresConnexion(u.id), "/bienvenue");

  await prisma.parcoursAccueil.create({ data: { userId: u.id, passees: ["photo", "entreprise", "pitch", "tombola"] } });
  assert.equal((await lib.etatParcours(u.id)).restantes, 0);
  assert.equal(await lib.pageApresConnexion(u.id), "/paiement");
  assert.equal(await lib.pageApresConnexion(u.id, "/annuaire"), "/paiement");
});

test("administrateur et compte refusé", { skip: sansBase }, async () => {
  const admin = await creerCompte("parcours", { acces: "ADMIN" });
  const refuse = await creerCompte("parcours", { statut: "REFUSE" });
  ids.push(admin.id, refuse.id);
  assert.equal(await lib.pageApresConnexion(admin.id), "/admin");
  assert.equal(await lib.pageApresConnexion(admin.id, "/annuaire"), "/annuaire");
  assert.equal(await lib.pageApresConnexion(refuse.id), "/en-attente");
});
