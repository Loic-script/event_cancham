import { expect, test } from "@playwright/test";
import { compte, jetonCreation, supprimer, type CompteTest } from "./outils";

/** Compte créé par un administrateur : le lien reçu par e-mail mène à la page où le membre crée son mot de passe, puis entre. */
let membre: CompteTest;

test.beforeAll(() => {
  membre = compte("e2e-creation", { statut: "ACTIF", billetPaye: true }, { pret: true });
});

test.afterAll(() => {
  supprimer([membre.id]);
});

test("créer son mot de passe par le lien, entrer, puis se reconnecter avec ; le lien ne sert qu'une fois", async ({ page }) => {
  const jeton = jetonCreation(membre.id);
  await page.goto(`/creer-mot-de-passe/${jeton}`);
  await expect(page.getByRole("heading", { name: "Créez votre mot de passe" })).toBeVisible();
  await expect(page.getByText(membre.email)).toBeVisible();
  await page.fill("#nouveau-password", "MonMotDePasse2026");
  await page.fill("#nouveau-confirmation", "MonMotDePasse2026");
  await page.getByRole("button", { name: "Créer mon mot de passe et entrer" }).click();
  // Parcours d'accueil terminé : l'espace participant s'ouvre directement.
  await expect(page).toHaveURL(/\/$/);

  // Le même lien ne sert plus.
  await page.goto(`/creer-mot-de-passe/${jeton}`);
  await expect(page.getByRole("heading", { name: "Lien expiré" })).toBeVisible();

  // Le mot de passe choisi permet de se connecter.
  await page.context().clearCookies();
  await page.goto("/connexion");
  await page.fill("#login-email", membre.email);
  await page.fill("#login-password", "MonMotDePasse2026");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/$/);
});
