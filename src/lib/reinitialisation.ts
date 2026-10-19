import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

/** Un lien « mot de passe oublié » reste valable 1 heure et ne sert qu'une fois. */
export const DUREE_LIEN_MINUTES = 60;
/** Délai minimal entre deux e-mails pour un même compte. */
const INTERVALLE_MS = 60_000;

export const empreinteJeton = (jeton: string) => createHash("sha256").update(jeton).digest("hex");

/** Crée un lien pour le compte (et efface les précédents), ou renvoie null si un e-mail vient déjà de partir. */
export async function creerJeton(userId: number): Promise<string | null> {
  const recent = await prisma.reinitialisationMotDePasse.findFirst({
    where: { userId, utiliseLe: null, createdAt: { gt: new Date(Date.now() - INTERVALLE_MS) } },
    select: { id: true },
  });
  if (recent) return null;
  const jeton = randomBytes(32).toString("base64url");
  await prisma.$transaction([
    prisma.reinitialisationMotDePasse.deleteMany({ where: { userId, utiliseLe: null } }),
    prisma.reinitialisationMotDePasse.create({ data: { userId, tokenHash: empreinteJeton(jeton), expiresAt: new Date(Date.now() + DUREE_LIEN_MINUTES * 60_000) } }),
  ]);
  return jeton;
}

/** Compte du lien s'il est encore valable (non utilisé, non expiré). */
export async function lireJeton(jeton: string): Promise<{ userId: number; email: string } | null> {
  if (!/^[\w-]{40,60}$/.test(jeton)) return null;
  const lien = await prisma.reinitialisationMotDePasse.findUnique({
    where: { tokenHash: empreinteJeton(jeton) },
    select: { utiliseLe: true, expiresAt: true, user: { select: { id: true, email: true } } },
  });
  if (!lien || lien.utiliseLe || lien.expiresAt <= new Date()) return null;
  return { userId: lien.user.id, email: lien.user.email };
}
