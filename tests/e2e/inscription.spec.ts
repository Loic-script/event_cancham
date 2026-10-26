import { expect, test } from "@playwright/test";
import { compte, connecter, courrielTest, supprimer, utilisateur, type CompteTest } from "./outils";

const email = courrielTest("e2e-inscription");
let paye: CompteTest;

test.beforeAll(() => {
  paye = compte("e2e-parcours", { statut: "ACTIF", billetPaye: true });
});

test.afterAll(() => {
  const u = utilisateur(email);
  supprimer([paye.id, ...(u ? [u.id] : [])]);
});

test("inscription par le formulaire : le règlement du billet vient tout de suite", async ({ page }) => {
  await page.goto("/inscription");
  await page.fill("#register-lastName", "Rakoto");
  await page.fill("#register-firstName", "Miora");
  await page.fill("#register-company", "Vanille Rouge");
  await page.fill("#register-role", "Directrice export");
  await page.fill("#register-email", email);
  await page.fill("#register-phone", "+261 34 12 345 67");
  await page.fill("#register-password", "Traversee2026!");
  await page.getByRole("button", { name: "Créer mon compte" }).click();

  // Compte en attente : le paiement s'affiche avant le parcours d'accueil, qui reste fermé tant que le billet n'est pas réglé.
  await expect(page).toHaveURL(/\/paiement$/);
  await expect(page.getByRole("button", { name: "MVola" })).toBeVisible();
  await page.goto("/bienvenue");
  await expect(page).toHaveURL(/\/paiement$/);

  const u = utilisateur(email);
  expect(u?.statut).toBe("EN_ATTENTE");
  expect(u?.parcoursAccueil).toBeNull();
});

test("billet réglé : parcours d'accueil en deux étapes (photo, entreprise), sans les défis", async ({ browser }) => {
  const ctx = await browser.newContext();
  await connecter(ctx, paye.id);
  const page = await ctx.newPage();

  await page.goto("/bienvenue");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Préparons");
  await expect(page.getByText("Défi 1 · Votre vidéo pitch")).toHaveCount(0);
  await page.getByRole("button", { name: "Commencer" }).click();

  await expect(page).toHaveURL(/etape=photo/);
  await page.getByRole("button", { name: "Passer cette étape" }).click();

  await expect(page).toHaveURL(/etape=entreprise/);
  await page.selectOption("#pa-secteur", "Agroalimentaire");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();

  await expect(page).toHaveURL(/etape=fin/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("prêt");
  await page.getByRole("button", { name: "Entrer dans l’espace participant" }).click();
  await expect(page).toHaveURL(/\/$/);

  const u = utilisateur(paye.email);
  expect(u?.sector).toBe("Agroalimentaire");
  expect(u?.participationsDefis).toEqual([]);
  expect(u?.parcoursAccueil?.passees).toEqual(["photo"]);
  expect(u?.parcoursAccueil?.termineLe).toBeTruthy();
  await ctx.close();
});
