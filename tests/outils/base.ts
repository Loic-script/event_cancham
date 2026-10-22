import "dotenv/config";

/**
 * Base PostgreSQL des tests automatisés : DATABASE_URL_TEST (dans .env ou l'environnement), jamais la base de développement
 * ni de production. Sans cette variable, les tests qui touchent la base sont ignorés (npm test reste vert).
 * Garde-fou : le nom de la base doit contenir « test » ou « ci ».
 */
const url = process.env.DATABASE_URL_TEST;

export const baseDisponible = Boolean(url);

/** Motif de `skip` pour `test(nom, { skip }, …)` : faux quand la base est là, sinon la raison affichée. */
export const sansBase = baseDisponible ? false : "DATABASE_URL_TEST absente : test de base ignoré";

if (url) {
  if (!/\/[^/?]*(test|ci)[^/?]*(\?|$)/i.test(url)) throw new Error("DATABASE_URL_TEST doit désigner une base dont le nom contient « test » ou « ci ».");
  // Avant tout chargement de src/lib/prisma : le client lit DATABASE_URL à sa création.
  process.env.DATABASE_URL = url;
}

/** Client Prisma branché sur la base de test (chargé après le réglage de DATABASE_URL). */
export async function basePrisma() {
  const { prisma } = await import("../../src/lib/prisma");
  return prisma;
}

/** Adresse e-mail unique pour un compte de test, reconnaissable au nettoyage. */
export const courrielTest = (suite: string) => `test-auto-${suite}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@exemple.mg`;

type Compte = { email?: string; firstName?: string; lastName?: string; acces?: "MEMBRE" | "ADMIN"; statut?: "EN_ATTENTE" | "ACTIF" | "REFUSE"; company?: string | null; role?: string | null; phone?: string | null; sector?: string | null; photo?: string | null; billetPaye?: boolean };

/** Compte de test avec des coordonnées complètes par défaut (comme après l'inscription par le formulaire). */
export async function creerCompte(suite: string, c: Compte = {}) {
  const prisma = await basePrisma();
  return prisma.user.create({
    data: {
      email: c.email ?? courrielTest(suite),
      firstName: c.firstName ?? "Test",
      lastName: c.lastName ?? suite,
      passwordHash: "scrypt$inutilisable",
      acces: c.acces ?? "MEMBRE",
      statut: c.statut ?? "ACTIF",
      company: c.company === undefined ? "Entreprise Test" : c.company,
      role: c.role === undefined ? "Gérante" : c.role,
      phone: c.phone === undefined ? "+261340000000" : c.phone,
      sector: c.sector ?? null,
      photo: c.photo ?? null,
      billetPaye: c.billetPaye ?? false,
    },
  });
}

/** Supprime les comptes créés par un test, avec tout ce qui en dépend. */
export async function supprimerComptes(ids: number[]) {
  const { supprimerCompte } = await import("../../src/lib/comptes");
  for (const id of ids) await supprimerCompte(id).catch(() => undefined);
}
