import { expect, test } from "@playwright/test";
import { courrielTest, supprimer, utilisateur } from "./outils";

const email = courrielTest("e2e-inscription");

test.afterAll(() => {
  const u = utilisateur(email);
  if (u) supprimer([u.id]);
});

test("inscription par le formulaire, puis parcours d'accueil jusqu'à la page d'attente", async ({ page }) => {
  await page.goto("/inscription");
  await page.fill("#register-lastName", "Rakoto");
  await page.fill("#register-firstName", "Miora");
  await page.fill("#register-company", "Vanille Rouge");
  await page.fill("#register-role", "Directrice export");
  await page.fill("#register-email", email);
  await page.fill("#register-phone", "+261 34 12 345 67");
  await page.fill("#register-password", "Traversee2026!");
  await page.getByRole("button", { name: "Créer mon compte" }).click();

  // Le compte est créé en attente de validation : le parcours d'accueil s'ouvre tout de suite.
  await expect(page).toHaveURL(/\/bienvenue/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Préparons");
  await page.getByRole("button", { name: "Commencer" }).click();

  await expect(page).toHaveURL(/etape=photo/);
  await page.getByRole("button", { name: "Passer cette étape" }).click();

  // Coordonnées de l'inscription préremplies ; le secteur reste à choisir.
  await expect(page).toHaveURL(/etape=entreprise/);
  await expect(page.locator("#pa-entreprise")).toHaveValue("Vanille Rouge");
  await expect(page.locator("#pa-prenom")).toHaveValue("Miora");
  await page.selectOption("#pa-secteur", "Agroalimentaire");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();

  await expect(page).toHaveURL(/etape=pitch/);
  await page.fill("#pa-pitch", "https://youtu.be/dQw4w9WgXcQ");
  await page.getByRole("button", { name: "Envoyer mon pitch" }).click();

  await expect(page).toHaveURL(/etape=tombola/);
  await page.getByRole("button", { name: "Passer cette étape" }).click();

  await expect(page).toHaveURL(/etape=fin/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("se prépare");
  await page.getByRole("button", { name: "J’ai compris" }).click();
  await expect(page).toHaveURL(/\/en-attente/);

  const u = utilisateur(email);
  expect(u?.statut).toBe("EN_ATTENTE");
  expect(u?.sector).toBe("Agroalimentaire");
  expect(u?.participationsDefis.map((p) => p.defi)).toEqual(["pitch"]);
  expect(u?.parcoursAccueil?.passees).toEqual(["photo", "tombola"]);
  expect(u?.parcoursAccueil?.termineLe).toBeTruthy();
});
