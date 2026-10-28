import { createHash, randomBytes } from "node:crypto";
import { hashPassword } from "../../src/lib/password";
import { basePrisma, creerCompte, supprimerComptes } from "../outils/base";

/**
 * Accès à la base de test pour les scénarios Playwright, lancé dans un processus tsx à part :
 * le client Prisma généré est en ESM (import.meta) et ne se charge pas dans le processus de Playwright.
 * Usage : node --import tsx tests/e2e/bd.ts <action> '<json>' ; la réponse JSON est sur la dernière ligne.
 */
type Donnees = Record<string, unknown>;

async function executer(action: string, d: Donnees): Promise<unknown> {
  const prisma = await basePrisma();
  switch (action) {
    case "compte": {
      const u = await creerCompte(String(d.suite), (d.options ?? {}) as Parameters<typeof creerCompte>[1]);
      // Parcours d'accueil terminé : la connexion mène directement à l'espace.
      if (d.pret) await prisma.parcoursAccueil.create({ data: { userId: u.id, termineLe: new Date() } });
      if (typeof d.motDePasse === "string") await prisma.user.update({ where: { id: u.id }, data: { passwordHash: await hashPassword(d.motDePasse) } });
      return { id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, codeBillet: u.codeBillet };
    }
    case "session": {
      const token = randomBytes(32).toString("base64url");
      await prisma.session.create({ data: { tokenHash: createHash("sha256").update(token).digest("hex"), userId: Number(d.id), expiresAt: new Date(Date.now() + 3600_000) } });
      return { token };
    }
    case "jeton": {
      // Lien « créez votre mot de passe » (compte créé par un administrateur), valable 7 jours.
      const { creerJeton, DUREE_CREATION_MINUTES } = await import("../../src/lib/reinitialisation");
      return { jeton: await creerJeton(Number(d.id), { dureeMinutes: DUREE_CREATION_MINUTES, sansDelai: true }) };
    }
    case "utilisateur":
      return prisma.user.findUnique({ where: { email: String(d.email) }, include: { participationsDefis: true, parcoursAccueil: true, paiements: { select: { reference: true, statut: true, mode: true } } } });
    case "supprimer":
      await supprimerComptes((d.ids as number[]) ?? []);
      return { ok: true };
    case "tentatives":
      // Échecs de connexion laissés par les tests (adresses de test et adresse locale), pour ne pas bloquer les suivants.
      await prisma.tentativeConnexion.deleteMany({ where: { OR: [{ cle: { startsWith: "email:test-auto-" } }, { cle: { in: ["ip:::1", "ip:127.0.0.1", "ip:inconnue"] } }] } });
      return { ok: true };
    default:
      throw new Error(`Action inconnue : ${action}`);
  }
}

const [action, brut] = process.argv.slice(2);
executer(action, JSON.parse(brut || "{}") as Donnees)
  .then(async (resultat) => {
    console.log(JSON.stringify(resultat ?? null));
    await (await basePrisma()).$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await (await basePrisma()).$disconnect();
    process.exit(1);
  });
