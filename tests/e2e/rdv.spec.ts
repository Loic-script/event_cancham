import { expect, test } from "@playwright/test";
import { compte, connecter, supprimer, type CompteTest } from "./outils";

let aina: CompteTest;
let bodo: CompteTest;

test.beforeAll(() => {
  aina = compte("e2e-rdv", { firstName: "Aina", lastName: "Essai", company: "Tsiky Tech" }, { pret: true });
  bodo = compte("e2e-rdv", { firstName: "Bodo", lastName: "Essai", company: "Baobab Conseil" }, { pret: true });
});

test.afterAll(() => {
  supprimer([aina.id, bodo.id]);
});

test("demande de rendez-vous depuis l'annuaire, validée par l'autre participant", async ({ browser }) => {
  const nomBodo = `${bodo.firstName} ${bodo.lastName}`;
  const nomAina = `${aina.firstName} ${aina.lastName}`;

  // Aina demande un rendez-vous à Bodo.
  const ctxA = await browser.newContext();
  await connecter(ctxA, aina.id);
  const a = await ctxA.newPage();
  await a.goto("/annuaire");
  const ficheBodo = a.locator("main [class*=fiche]", { hasText: nomBodo });
  await ficheBodo.getByRole("button", { name: "Rendez-vous" }).click();
  const dialogue = a.getByRole("dialog");
  await expect(dialogue.locator("#r-heure")).toBeEnabled();
  // Le quatrième créneau, moins exposé aux autres tests ; puis le premier emplacement libre.
  await dialogue.locator("#r-heure").selectOption({ index: 4 });
  await dialogue.locator("button:has(strong):not([disabled])").first().click();
  await dialogue.getByRole("button", { name: "Envoyer la demande" }).click();
  await expect(dialogue).toBeHidden();

  // Bodo reçoit la demande et la valide.
  const ctxB = await browser.newContext();
  await connecter(ctxB, bodo.id);
  const b = await ctxB.newPage();
  await b.goto("/rdv");
  const recues = b.locator("h2", { hasText: "Demandes reçues" }).locator("xpath=following-sibling::div[1]");
  await expect(recues).toContainText(nomAina);
  await recues.getByRole("button", { name: "Valider" }).click();
  const confirmesB = b.locator("h2", { hasText: "Rendez-vous confirmés" }).locator("xpath=following-sibling::div[1]");
  await expect(confirmesB).toContainText(nomAina);
  await expect(confirmesB).toContainText("Confirmé");

  // Aina le voit confirmé.
  await a.goto("/rdv");
  const confirmesA = a.locator("h2", { hasText: "Rendez-vous confirmés" }).locator("xpath=following-sibling::div[1]");
  await expect(confirmesA).toContainText(nomBodo);
  await expect(confirmesA).toContainText("Confirmé");

  await ctxA.close();
  await ctxB.close();
});
