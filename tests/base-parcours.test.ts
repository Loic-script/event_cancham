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

test("compte validé : deux étapes (photo, entreprise), parcours à la connexion tant qu'il n'est pas terminé", { skip: sansBase }, async () => {
  const prisma = await basePrisma();
  const u = await creerCompte("parcours");
  ids.push(u.id);

  let etat = await lib.etatParcours(u.id);
  assert.deepEqual(etat.etapes.map((e) => e.id), ["photo", "entreprise"]);
  assert.equal(etat.commence, false);
  assert.equal(etat.restantes, 2);
  assert.equal(await lib.pageApresConnexion(u.id), "/bienvenue");
  assert.equal(await lib.pageApresConnexion(u.id, "/annuaire"), "/bienvenue?next=%2Fannuaire");

  // Les étapes faites se lisent dans les données du compte ; une étape passée est gardée dans le parcours.
  // Une ancienne étape de défi encore enregistrée comme passée est ignorée : les défis ne font plus partie du parcours.
  await prisma.user.update({ where: { id: u.id }, data: { photo: "/api/profil/photos/0123456789abcdef0123456789abcdef" } });
  await prisma.parcoursAccueil.create({ data: { userId: u.id, passees: ["entreprise", "tombola"] } });
  etat = await lib.etatParcours(u.id);
  assert.deepEqual(etat.etapes.map((e) => [e.fait, e.passee]), [[true, false], [false, true]]);
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

test("compte en attente : profil à compléter, règlement du billet, puis parcours", { skip: sansBase }, async () => {
  const prisma = await basePrisma();
  const u = await creerCompte("parcours", { statut: "EN_ATTENTE", phone: null });
  ids.push(u.id);
  assert.equal(await lib.pageApresConnexion(u.id), "/inscription/completer");

  // Coordonnées complètes : le billet se règle avant le parcours, même s'il n'est pas commencé.
  await prisma.user.update({ where: { id: u.id }, data: { phone: "+261340000000" } });
  assert.equal(await lib.pageApresConnexion(u.id), "/paiement");
  assert.equal(await lib.pageApresConnexion(u.id, "/annuaire"), "/paiement");

  // Billet réglé : l'accès est ouvert et le parcours d'accueil s'affiche.
  await prisma.user.update({ where: { id: u.id }, data: { statut: "ACTIF" } });
  assert.equal(await lib.pageApresConnexion(u.id), "/bienvenue");
});

test("administrateur et compte refusé", { skip: sansBase }, async () => {
  const admin = await creerCompte("parcours", { acces: "ADMIN" });
  const refuse = await creerCompte("parcours", { statut: "REFUSE" });
  ids.push(admin.id, refuse.id);
  assert.equal(await lib.pageApresConnexion(admin.id), "/admin");
  assert.equal(await lib.pageApresConnexion(admin.id, "/annuaire"), "/annuaire");
  assert.equal(await lib.pageApresConnexion(refuse.id), "/en-attente");
});
