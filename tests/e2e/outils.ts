import { execFileSync } from "node:child_process";
import path from "node:path";
import type { BrowserContext } from "@playwright/test";

/**
 * Outils des scénarios navigateur. La base de test est manipulée par tests/e2e/bd.ts dans un processus tsx à part
 * (le client Prisma généré ne se charge pas dans le processus de Playwright).
 */
function bd<T>(action: string, donnees: unknown = {}): T {
  const sortie = execFileSync(process.execPath, ["--import", "tsx", path.join(__dirname, "bd.ts"), action, JSON.stringify(donnees)], { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
  return JSON.parse(sortie.trim().split("\n").pop() ?? "null") as T;
}

export type CompteTest = { id: number; email: string; firstName: string; lastName: string; codeBillet: string };

type OptionsCompte = { firstName?: string; lastName?: string; acces?: "MEMBRE" | "ADMIN"; statut?: "EN_ATTENTE" | "ACTIF" | "REFUSE"; company?: string | null; billetPaye?: boolean };

/** Compte de test ; `pret` : parcours d'accueil terminé (l'espace s'ouvre directement) ; `motDePasse` : pour se connecter par le formulaire. */
export const compte = (suite: string, options: OptionsCompte = {}, extra: { pret?: boolean; motDePasse?: string } = {}) => bd<CompteTest>("compte", { suite, options, ...extra });

export const supprimer = (ids: number[]) => bd<{ ok: true }>("supprimer", { ids });

export const effacerTentatives = () => bd<{ ok: true }>("tentatives");

export const utilisateur = (email: string) => bd<null | { id: number; statut: string; sector: string | null; participationsDefis: { defi: string }[]; parcoursAccueil: { passees: string[]; termineLe: string | null } | null; paiements: { reference: string; statut: string; mode: string }[] }>("utilisateur", { email });

/** Ouvre le navigateur déjà connecté avec ce compte (cookie de session posé directement). */
export async function connecter(context: BrowserContext, id: number): Promise<void> {
  const { token } = bd<{ token: string }>("session", { id });
  await context.addCookies([{ name: "session", value: token, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" }]);
}

/** Adresse e-mail unique pour un compte créé par le formulaire d'inscription. */
export const courrielTest = (suite: string) => `test-auto-${suite}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@exemple.mg`;
