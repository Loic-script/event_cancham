import { envoyerCourriel } from "@/lib/courriel";
import { courrielNouvelleInscription } from "@/lib/courriels";
import { prisma } from "@/lib/prisma";
import { urlPublique } from "@/lib/url";

/** Adresse du site pour les liens des e-mails : APP_URL en production, l'hôte local en développement. */
export async function baseCourriel(): Promise<string | null> {
  try {
    return await urlPublique({ fiable: true });
  } catch {
    return null;
  }
}

/**
 * Prévient tous les administrateurs qu'une personne attend la validation de son accès.
 * À lancer avec after() : une erreur d'envoi est seulement journalisée, l'inscription n'en dépend pas.
 */
export async function alerterNouvelleInscription(userId: number, base: string | null): Promise<void> {
  try {
    const [u, admins] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true, email: true, company: true, role: true, phone: true, googleId: true, facebookId: true } }),
      prisma.user.findMany({ where: { acces: "ADMIN", id: { not: userId } }, select: { email: true }, orderBy: { id: "asc" } }),
    ]);
    if (!u || !admins.length) return;
    const via = u.googleId ? "avec Google" : u.facebookId ? "avec Facebook" : "par le formulaire";
    const adresses = admins.map((a) => a.email);
    // Resend accepte 50 destinataires par e-mail.
    for (let i = 0; i < adresses.length; i += 50) {
      await envoyerCourriel(courrielNouvelleInscription({ ...u, via }, adresses.slice(i, i + 50), base));
    }
  } catch (error) {
    console.error("Alerte « nouvelle inscription » non envoyée aux administrateurs :", error);
  }
}
