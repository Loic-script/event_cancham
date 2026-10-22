import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { baseDisponible, basePrisma, creerCompte, sansBase, supprimerComptes } from "./outils/base";

/** Défis sur la base de test : participations, liste du jury, relevé des réactions. */
type Lib = typeof import("../src/lib/defis");

let lib: Lib;
let aina = 0;
let attente = 0;
const LIEN = "https://www.facebook.com/aina.test/posts/pfbid0test";

before(async () => {
  if (!baseDisponible) return;
  lib = await import("../src/lib/defis");
  const prisma = await basePrisma();
  aina = (await creerCompte("defi", { firstName: "Aina" })).id;
  attente = (await creerCompte("defi", { firstName: "Attente", statut: "EN_ATTENTE" })).id;
  await prisma.participationDefi.createMany({
    data: [
      { defi: "pitch", userId: aina, lien: "https://youtu.be/dQw4w9WgXcQ" },
      { defi: "pitch", userId: attente, lien: "https://youtu.be/autre" },
      { defi: "tombola", userId: aina, lien: LIEN },
    ],
  });
});

after(async () => {
  if (!baseDisponible) return;
  await supprimerComptes([aina, attente]);
  await (await basePrisma()).$disconnect();
});

test("ma participation : lien et relevé", { skip: sansBase }, async () => {
  const p = await lib.maParticipation(aina, "tombola");
  assert.equal(p?.lien, LIEN);
  assert.equal(p?.reactions, null);
  assert.equal(await lib.maParticipation(attente, "tombola"), null);
});

test("le jury ne voit que les comptes validés", { skip: sansBase }, async () => {
  const noms = (await lib.participants("pitch")).map((p) => p.porteur);
  assert.ok(noms.includes("Aina defi"));
  assert.ok(!noms.includes("Attente defi"));
  const [p] = (await lib.participants("pitch")).filter((p) => p.userId === aina);
  assert.equal(p.note, null);
  assert.equal(p.retire, false);
});

test("le relevé des réactions ne s'applique qu'au lien enregistré par ce compte", { skip: sansBase }, async () => {
  await lib.enregistrerReleve(aina, "https://www.facebook.com/autre/posts/1", { reactions: 99, comments: 9, shares: 9 });
  assert.equal((await lib.maParticipation(aina, "tombola"))?.reactions, null);

  const avant = Date.now();
  await lib.enregistrerReleve(aina, LIEN, { reactions: 12, comments: 3, shares: 1 });
  const p = await lib.maParticipation(aina, "tombola");
  assert.equal(p?.reactions, 12);
  assert.equal(p?.commentaires, 3);
  assert.equal(p?.partages, 1);
  assert.ok(p?.releveLe && p.releveLe >= avant - 1000);
  assert.equal((await lib.participants("tombola")).find((x) => x.userId === aina)?.reactions, 12);
});
