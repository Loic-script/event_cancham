import { expect, test, type Page } from "@playwright/test";
import { compte, effacerTentatives, supprimer, type CompteTest } from "./outils";

const MOT_DE_PASSE = "Secret-Traversee-2026!";
let aina: CompteTest;
let bloque: CompteTest;

test.beforeAll(() => {
  aina = compte("e2e-connexion", { firstName: "Aina" }, { pret: true, motDePasse: MOT_DE_PASSE });
  bloque = compte("e2e-connexion", { firstName: "Bloqué" }, { pret: true });
  effacerTentatives();
});

test.afterAll(() => {
  effacerTentatives();
  supprimer([aina.id, bloque.id]);
});

/** Le message d'erreur du formulaire (Next ajoute aussi un role=alert d'annonce de page). */
const erreur = (page: Page) => page.locator("p[role=alert]");

async function tenter(page: Page, courriel: string, motDePasse: string) {
  await page.fill("#login-email", courriel);
  await page.fill("#login-password", motDePasse);
  await page.getByRole("button", { name: "Se connecter" }).click();
}

test("mauvais mot de passe refusé, bon mot de passe accepté", async ({ page }) => {
  await page.goto("/connexion");
  await tenter(page, aina.email, "pas-le-bon");
  await expect(erreur(page)).toContainText("incorrect");

  await tenter(page, aina.email, MOT_DE_PASSE);
  // Parcours d'accueil terminé : l'accueil de l'espace participant.
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Actualités" })).toBeVisible();
});

test("cinq échecs bloquent la connexion pendant quinze minutes", async ({ page }) => {
  await page.goto("/connexion");
  for (let i = 1; i <= 5; i++) {
    await tenter(page, bloque.email, `mauvais-${i}`);
    await expect(erreur(page)).toContainText("incorrect");
  }
  await tenter(page, bloque.email, "mauvais-6");
  await expect(erreur(page)).toContainText("Trop de tentatives");
});
