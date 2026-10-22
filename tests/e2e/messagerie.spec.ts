import { expect, test } from "@playwright/test";
import { compte, connecter, supprimer, type CompteTest } from "./outils";

let aina: CompteTest;
let bodo: CompteTest;

test.beforeAll(() => {
  aina = compte("e2e-messages", { firstName: "Aina", lastName: "Essai" }, { pret: true });
  bodo = compte("e2e-messages", { firstName: "Bodo", lastName: "Essai" }, { pret: true });
});

test.afterAll(() => {
  supprimer([aina.id, bodo.id]);
});

test("un message envoyé est lu par son destinataire", async ({ browser }) => {
  const texte = `Bonjour Bodo, on se voit au gala ? (${Date.now()})`;

  const ctxA = await browser.newContext();
  await connecter(ctxA, aina.id);
  const a = await ctxA.newPage();
  await a.goto(`/messages/avec/${bodo.id}`);
  await a.locator("textarea").fill(texte);
  await a.getByRole("button", { name: "Envoyer", exact: true }).click();
  // La bulle du fil (le texte apparaît aussi en aperçu dans la liste des conversations).
  await expect(a.locator("[class*=bubble]", { hasText: texte })).toBeVisible();

  const ctxB = await browser.newContext();
  await connecter(ctxB, bodo.id);
  const b = await ctxB.newPage();
  await b.goto("/messages");
  await expect(b.getByText("Aina Essai").first()).toBeVisible();
  await b.goto(`/messages/avec/${aina.id}`);
  await expect(b.locator("[class*=bubble]", { hasText: texte })).toBeVisible();

  await ctxA.close();
  await ctxB.close();
});
