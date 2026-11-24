import path from "node:path";
import { expect, test } from "@playwright/test";
import { compte, connecter, supprimer, type CompteTest } from "./outils";

/**
 * Publication avec vidéo : l'équipe publie au nom de la CanCham depuis le back-office avec une vraie vidéo WebM ;
 * la vidéo est envoyée, servie, et visible dans le fil de l'admin et dans celui d'un participant.
 */
const VIDEO = path.join(__dirname, "fixtures", "video.webm");
let admin: CompteTest;
let membre: CompteTest;

test.beforeAll(() => {
  admin = compte("e2e-video", { acces: "ADMIN" });
  membre = compte("e2e-video", { statut: "ACTIF", billetPaye: true }, { pret: true });
});

test.afterAll(() => {
  supprimer([admin.id, membre.id]);
});

test("l'équipe publie une vidéo au nom de la CanCham, lisible par les participants", async ({ browser }) => {
  const ctx = await browser.newContext();
  await connecter(ctx, admin.id);
  const page = await ctx.newPage();
  await page.goto("/admin");

  // Le bouton Vidéo du composeur ouvre la fenêtre et le sélecteur de fichier.
  const choix = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Vidéo", exact: true }).click();
  await (await choix).setFiles(VIDEO);
  const fenetre = page.getByRole("dialog", { name: "Créer une publication" });
  await expect(fenetre.locator("video")).toBeVisible();
  await expect(fenetre.getByText("video.webm")).toBeVisible();
  await fenetre.getByLabel("Votre publication").fill("Vidéo de test de l’équipe");
  await fenetre.getByRole("button", { name: "Publier", exact: true }).click();

  await expect(page.getByText("Publication en ligne sur l’accueil des participants.")).toBeVisible();
  const publiee = page.locator("[class*=article]", { hasText: "Vidéo de test de l’équipe" }).first();
  await expect(publiee.locator("video")).toBeVisible();
  const src = await publiee.locator("video").getAttribute("src");
  expect(src).toMatch(/^\/api\/videos\/[a-f0-9]{32}$/);

  // La vidéo est bien servie, dans son format.
  const reponse = await page.request.get(src!);
  expect(reponse.status()).toBe(200);
  expect(reponse.headers()["content-type"]).toContain("video/webm");
  expect((await reponse.body()).length).toBeGreaterThan(1000);
  await ctx.close();

  // Un participant la voit sur son accueil.
  const ctxMembre = await browser.newContext();
  await connecter(ctxMembre, membre.id);
  const accueil = await ctxMembre.newPage();
  await accueil.goto("/");
  const vue = accueil.locator("[class*=article]", { hasText: "Vidéo de test de l’équipe" }).first();
  await expect(vue.locator("video")).toHaveAttribute("src", src!);
  expect((await accueil.request.get(src!)).status()).toBe(200);
  await ctxMembre.close();
});
