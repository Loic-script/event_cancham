import { expect, test, type Browser } from "@playwright/test";
import { compte, connecter, supprimer, utilisateur, type CompteTest } from "./outils";

/**
 * Règlement du billet par Vanilla Pay, avec le simulateur local (VANILLAPAY_BASE pointe sur /simulateur-vanillapay) :
 * un compte en attente dont le parcours est terminé est renvoyé vers /paiement ; un paiement réussi ouvre l'accès,
 * un paiement échoué ou d'un montant différent n'ouvre rien.
 */
let reussi: CompteTest;
let echoue: CompteTest;
let montant: CompteTest;
let sansNotif: CompteTest;

test.beforeAll(() => {
  reussi = compte("e2e-paiement", { statut: "EN_ATTENTE", firstName: "Réussi" }, { pret: true });
  echoue = compte("e2e-paiement", { statut: "EN_ATTENTE", firstName: "Échoué" }, { pret: true });
  montant = compte("e2e-paiement", { statut: "EN_ATTENTE", firstName: "Montant" }, { pret: true });
  sansNotif = compte("e2e-paiement", { statut: "EN_ATTENTE", firstName: "Retour" }, { pret: true });
});

test.afterAll(() => {
  supprimer([reussi.id, echoue.id, montant.id, sansNotif.id]);
});

/** Ouvre la page de paiement d'un compte connecté et part chez le simulateur par le moyen demandé. */
async function allerPayer(browser: Browser, c: CompteTest, moyen: string) {
  const ctx = await browser.newContext();
  await connecter(ctx, c.id);
  const page = await ctx.newPage();
  // Tant que le billet n'est pas réglé, l'espace renvoie vers le paiement.
  await page.goto("/");
  await expect(page).toHaveURL(/\/paiement$/);
  await expect(page.getByText("500 000 Ar")).toBeVisible();
  await page.getByRole("button", { name: moyen }).click();
  await expect(page).toHaveURL(/\/simulateur-vanillapay\/payer\?id=/);
  await expect(page.getByRole("heading", { name: /Paiement de 500 000 Ar/ })).toBeVisible();
  return { ctx, page };
}

test("paiement réussi : accès ouvert, retour dans l'espace", async ({ browser }) => {
  const { ctx, page } = await allerPayer(browser, reussi, "MVola");
  await page.getByRole("button", { name: "Paiement réussi" }).click();
  await expect(page).toHaveURL(/\/paiement\/retour\?ref=LT-2026-/);
  await expect(page.getByText("Paiement reçu, votre accès est ouvert.")).toBeVisible();
  expect(utilisateur(reussi.email)?.statut).toBe("ACTIF");

  await page.getByRole("link", { name: "Entrer dans la plateforme" }).click();
  await expect(page).toHaveURL(/\/$/);
  // La page de paiement n'est plus proposée.
  await page.goto("/paiement");
  await expect(page).toHaveURL(/\/$/);
  await ctx.close();
});

test("paiement échoué : rien n'est ouvert, on peut réessayer", async ({ browser }) => {
  const { ctx, page } = await allerPayer(browser, echoue, "Carte bancaire");
  await page.getByRole("button", { name: "Paiement échoué" }).click();
  await expect(page).toHaveURL(/\/paiement\/retour\?ref=/);
  await expect(page.getByText("Paiement refusé, rien n’a été débité.")).toBeVisible();
  expect(utilisateur(echoue.email)?.statut).toBe("EN_ATTENTE");
  await page.getByRole("link", { name: "Réessayer" }).click();
  await expect(page).toHaveURL(/\/paiement$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/paiement$/);
  await ctx.close();
});

test("montant différent de celui attendu : rien n'est ouvert", async ({ browser }) => {
  const { ctx, page } = await allerPayer(browser, montant, "Orange Money");
  await page.getByRole("button", { name: "Réussi avec un montant différent" }).click();
  await expect(page).toHaveURL(/\/paiement\/retour\?ref=/);
  await expect(page.getByText("Paiement refusé, rien n’a été débité.")).toBeVisible();
  expect(utilisateur(montant.email)?.statut).toBe("EN_ATTENTE");
  await ctx.close();
});

test("sans notification : la page de retour vérifie l'état chez le prestataire et ouvre l'accès", async ({ browser }) => {
  const { ctx, page } = await allerPayer(browser, sansNotif, "Airtel Money");
  await page.getByLabel("Sans notification").check();
  await page.getByRole("button", { name: "Paiement réussi" }).click();
  await expect(page).toHaveURL(/\/paiement\/retour\?ref=/);
  await expect(page.getByText("Paiement reçu, votre accès est ouvert.")).toBeVisible();
  expect(utilisateur(sansNotif.email)?.statut).toBe("ACTIF");
  await ctx.close();
});
