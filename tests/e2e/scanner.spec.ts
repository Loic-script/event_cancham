import { expect, test } from "@playwright/test";
import { compte, connecter, supprimer, type CompteTest } from "./outils";

let admin: CompteTest;
let paye: CompteTest;
let impaye: CompteTest;

test.beforeAll(() => {
  admin = compte("e2e-scanner", { acces: "ADMIN" });
  paye = compte("e2e-scanner", { firstName: "Payé", billetPaye: true }, { pret: true });
  impaye = compte("e2e-scanner", { firstName: "Impayé" }, { pret: true });
});

test.afterAll(() => {
  supprimer([admin.id, paye.id, impaye.id]);
});

test("scanner : entrée validée, déjà scanné, paiement reçu à l'entrée", async ({ browser }) => {
  const ctx = await browser.newContext();
  await connecter(ctx, admin.id);
  const page = await ctx.newPage();
  await page.goto("/admin/scanner");
  // Le verdict (pas le toast, lui aussi en role=status).
  const verdict = page.locator("[role=status][class*=verdict]");

  async function verifier(code: string) {
    await page.fill("#sc-code", code);
    await page.getByRole("button", { name: "Vérifier" }).click();
  }

  await verifier("TRV26-00000000");
  await expect(verdict).toContainText("Billet inconnu");

  await verifier(paye.codeBillet.toLowerCase());
  await expect(verdict).toContainText("Entrée validée");
  await expect(verdict).toContainText(paye.firstName);

  // Le même billet ne passe pas deux fois.
  await verifier(paye.codeBillet);
  await expect(verdict).toContainText("Déjà scanné");

  await verifier(impaye.codeBillet);
  await expect(verdict).toContainText("Paiement en attente");
  await verdict.getByRole("button", { name: "Paiement reçu : valider l’entrée" }).click();
  await expect(verdict).toContainText("Entrée validée");

  // Les deux entrées sont dans la liste.
  const liste = page.locator("[class*=histo]").first();
  await expect(liste).toContainText(paye.firstName);
  await expect(liste).toContainText(impaye.firstName);
  await ctx.close();
});
