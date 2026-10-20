import { randomBytes } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { PAGE_COMPLETER } from "@/lib/coordonnees";
import { pageApresConnexion } from "@/lib/parcours";
import type { CodeErreurSociale, Fournisseur, ProfilSocial } from "@/lib/oauth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

export { PAGE_COMPLETER };

const selection = { id: true, acces: true, statut: true, company: true, role: true, phone: true } as const;

/**
 * Connecte le compte relié à ce profil Google ou Facebook. À défaut, relie le compte qui a la même adresse
 * (confirmée par le fournisseur, sauf compte administrateur), ou en crée un nouveau, en attente de validation comme une inscription classique.
 * Renvoie la page où aller ensuite.
 */
export async function connecterAvecProfil(f: Fournisseur, p: ProfilSocial, next: string): Promise<{ destination: string } | { erreur: CodeErreurSociale }> {
  const lien = f === "google" ? { googleId: p.id } : { facebookId: p.id };
  let user = await prisma.user.findUnique({ where: lien, select: selection });

  if (!user) {
    if (!p.email) return { erreur: "email" };
    if (!p.emailVerifie) return { erreur: "non-verifie" };
    const existant = await prisma.user.findUnique({ where: { email: p.email }, select: { id: true, acces: true } });
    // Le back-office ne s'ouvre pas sur la seule foi d'une adresse transmise par Google ou Facebook.
    if (existant?.acces === "ADMIN") return { erreur: "admin" };
    try {
      user = existant
        ? await prisma.user.update({ where: { id: existant.id }, data: lien, select: selection })
        : await prisma.user.create({
            data: {
              email: p.email,
              // Mot de passe aléatoire jamais communiqué : « Mot de passe oublié » permet d'en choisir un.
              passwordHash: await hashPassword(randomBytes(32).toString("base64url")),
              firstName: p.prenom.trim().slice(0, 60),
              lastName: p.nom.trim().slice(0, 60),
              ...lien,
            },
            select: selection,
          });
    } catch (error) {
      // Double retour du fournisseur : le compte vient d'être créé ou relié par la première requête.
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
      user = await prisma.user.findUnique({ where: lien, select: selection });
      if (!user) throw error;
    }
  }

  await createSession(user.id);
  // Profil à compléter, parcours d'accueil ou page demandée : même règle qu'après une connexion classique.
  return { destination: await pageApresConnexion(user.id, next) };
}

/** Page de connexion ou d'inscription, avec le message d'erreur à afficher. */
export function pageErreurSociale(depuis: "connexion" | "inscription", f: string, code: CodeErreurSociale, next: string): string {
  const p = new URLSearchParams({ erreur: code, via: f });
  if (next !== "/") p.set("next", next);
  return `/${depuis}?${p}`;
}
