"use server";

import { revalidatePath } from "next/cache";
import { URL_VIDEO, effacerFichiersPublication } from "@/lib/fil";
import { prisma } from "@/lib/prisma";
import { aAccesEspace, getCurrentUser } from "@/lib/session";
import { MAX_TEXTE_SOUVENIR } from "@/lib/traversee/livre";

type Resultat = { error: string | null };

const RESERVE = "Action réservée aux administrateurs.";
const INTROUVABLE = "Ce souvenir n’existe plus.";

async function admin() {
  const user = await getCurrentUser();
  return user && user.acces === "ADMIN" ? user : null;
}

function rafraichir() {
  revalidatePath("/livre");
  revalidatePath("/admin/livre");
}

/** Dépôt d'une vidéo souvenir (déjà envoyée sur /api/videos) : en attente de validation. */
export async function deposerSouvenir(video: unknown, duree: unknown, texte: unknown): Promise<Resultat> {
  const user = await getCurrentUser();
  if (!user || !aAccesEspace(user)) return { error: "Votre session a expiré ou votre accès n’est pas encore validé." };
  if (typeof video !== "string" || !URL_VIDEO.test(video)) return { error: "Ajoutez votre vidéo." };
  const message = typeof texte === "string" ? texte.trim() : "";
  if (message.length > MAX_TEXTE_SOUVENIR) return { error: `Votre message fait ${MAX_TEXTE_SOUVENIR} caractères au plus.` };
  const enAttente = await prisma.souvenirLivre.count({ where: { auteurId: user.id, statut: "ATTENTE" } });
  if (enAttente >= 3) return { error: "Vous avez déjà trois vidéos en attente de validation : patientez avant d’en envoyer une autre." };
  const secondes = Number(duree);
  await prisma.souvenirLivre.create({ data: { auteurId: user.id, video, texte: message, duree: Number.isFinite(secondes) && secondes > 0 ? Math.round(Math.min(secondes, 3600)) : null } });
  rafraichir();
  return { error: null };
}

/** Le participant retire un souvenir pas encore publié (la vidéo est effacée). */
export async function retirerMonSouvenir(id: unknown): Promise<Resultat> {
  const user = await getCurrentUser();
  if (!user || !aAccesEspace(user)) return { error: "Votre session a expiré ou votre accès n’est pas encore validé." };
  if (typeof id !== "string") return { error: INTROUVABLE };
  const s = await prisma.souvenirLivre.findUnique({ where: { id }, select: { auteurId: true, video: true, statut: true } });
  if (!s || s.auteurId !== user.id) return { error: INTROUVABLE };
  if (s.statut === "VALIDE") return { error: "Ce souvenir est publié : demandez à l’équipe CanCham de le retirer." };
  await prisma.souvenirLivre.delete({ where: { id } });
  await effacerFichiersPublication(null, s.video);
  rafraichir();
  return { error: null };
}

export async function deciderSouvenir(id: unknown, etat: unknown): Promise<Resultat> {
  if (!(await admin())) return { error: RESERVE };
  const statut = etat === "valide" ? "VALIDE" : etat === "refuse" ? "REFUSE" : null;
  if (typeof id !== "string" || !statut) return { error: INTROUVABLE };
  const { count } = await prisma.souvenirLivre.updateMany({ where: { id }, data: { statut, decideLe: new Date() } });
  if (!count) return { error: INTROUVABLE };
  rafraichir();
  return { error: null };
}

export async function modifierTexteSouvenir(id: unknown, texte: unknown): Promise<Resultat> {
  if (!(await admin())) return { error: RESERVE };
  const t = typeof texte === "string" ? texte.trim() : "";
  if (typeof id !== "string") return { error: INTROUVABLE };
  if (t.length > MAX_TEXTE_SOUVENIR) return { error: `Le message fait ${MAX_TEXTE_SOUVENIR} caractères au plus.` };
  const { count } = await prisma.souvenirLivre.updateMany({ where: { id }, data: { texte: t } });
  if (!count) return { error: INTROUVABLE };
  rafraichir();
  return { error: null };
}

/** Suppression définitive (vidéo comprise). */
export async function supprimerSouvenir(id: unknown): Promise<Resultat> {
  if (!(await admin())) return { error: RESERVE };
  if (typeof id !== "string") return { error: INTROUVABLE };
  const s = await prisma.souvenirLivre.findUnique({ where: { id }, select: { video: true } });
  if (!s) return { error: INTROUVABLE };
  await prisma.souvenirLivre.delete({ where: { id } });
  await effacerFichiersPublication(null, s.video);
  rafraichir();
  return { error: null };
}
