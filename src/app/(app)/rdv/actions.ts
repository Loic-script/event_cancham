"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { confirmer, creerDemande, creneauValide, disponibilites, etatDe, lieuValide, type Disponibilites } from "@/lib/rendezvous";
import { aAccesEspace, getCurrentUser } from "@/lib/session";

type Resultat = { error: string | null };

const SANS_ACCES = "Votre session a expiré ou votre accès n’est pas encore validé.";
const INTROUVABLE = "Ce rendez-vous n’existe plus.";

async function membre() {
  const user = await getCurrentUser();
  return user && aAccesEspace(user) ? user : null;
}

function rafraichir() {
  revalidatePath("/rdv");
  revalidatePath("/annuaire");
  revalidatePath("/", "layout");
}

/** Participant à qui l'on peut demander un rendez-vous : membre validé, autre que soi. */
async function interlocuteurValide(moi: number, avec: unknown): Promise<number | null> {
  const id = Number(avec);
  if (!Number.isInteger(id) || id === moi) return null;
  const u = await prisma.user.findUnique({ where: { id }, select: { acces: true, statut: true } });
  return u && u.acces === "MEMBRE" && u.statut === "ACTIF" ? id : null;
}

export async function chargerDisponibilites(avec: unknown, sauf?: unknown): Promise<Resultat & { dispo?: Disponibilites }> {
  const user = await membre();
  if (!user) return { error: SANS_ACCES };
  const id = await interlocuteurValide(user.id, avec);
  if (!id) return { error: "Ce participant n’est pas disponible pour un rendez-vous." };
  return { error: null, dispo: await disponibilites(user.id, id, typeof sauf === "string" ? sauf : undefined) };
}

/**
 * Demande un rendez-vous. `remplace` : demande reçue à laquelle on propose un autre créneau (elle est déclinée),
 * ou ancienne demande déclinée ou expirée que l'on renouvelle (elle est retirée).
 */
export async function demanderRdv(avec: unknown, ci: unknown, li: unknown, remplace?: unknown): Promise<Resultat> {
  const user = await membre();
  if (!user) return { error: SANS_ACCES };
  const id = await interlocuteurValide(user.id, avec);
  if (!id) return { error: "Ce participant n’est pas disponible pour un rendez-vous." };
  if (!creneauValide(ci) || !lieuValide(li)) return { error: "Choisissez une heure et un emplacement." };

  if (typeof remplace === "string") {
    const ancien = await prisma.rendezVousB2B.findUnique({ where: { id: remplace }, select: { demandeurId: true, destinataireId: true, statut: true, creeLe: true } });
    const concerne = ancien && [ancien.demandeurId, ancien.destinataireId].includes(user.id) && [ancien.demandeurId, ancien.destinataireId].includes(id);
    if (concerne && ancien) {
      const etat = etatDe(ancien);
      if (ancien.destinataireId === user.id && etat === "attente") await prisma.rendezVousB2B.update({ where: { id: remplace }, data: { statut: "DECLINE", decideLe: new Date() } });
      else if (ancien.demandeurId === user.id && (etat === "decline" || etat === "expire")) await prisma.rendezVousB2B.update({ where: { id: remplace }, data: { statut: "ANNULE" } });
    }
  }

  const erreur = await creerDemande(user.id, id, ci, li);
  if (erreur) return { error: erreur };
  rafraichir();
  return { error: null };
}

/** Le destinataire valide ou décline une demande reçue. */
export async function repondreRdv(id: unknown, reponse: "valider" | "decliner"): Promise<Resultat> {
  const user = await membre();
  if (!user) return { error: SANS_ACCES };
  if (typeof id !== "string") return { error: INTROUVABLE };
  if (reponse === "valider") {
    const erreur = await confirmer(id, user.id);
    if (erreur) return { error: erreur };
  } else {
    const { count } = await prisma.rendezVousB2B.updateMany({ where: { id, destinataireId: user.id, statut: "ATTENTE" }, data: { statut: "DECLINE", decideLe: new Date() } });
    if (!count) return { error: "Cette demande a déjà reçu une réponse." };
  }
  rafraichir();
  return { error: null };
}

/** Annule un rendez-vous confirmé (l'un ou l'autre), retire sa demande en attente, ou efface une demande déclinée ou expirée. */
export async function annulerRdv(id: unknown): Promise<Resultat> {
  const user = await membre();
  if (!user) return { error: SANS_ACCES };
  if (typeof id !== "string") return { error: INTROUVABLE };
  const r = await prisma.rendezVousB2B.findUnique({ where: { id }, select: { demandeurId: true, destinataireId: true, statut: true, creeLe: true } });
  if (!r || ![r.demandeurId, r.destinataireId].includes(user.id)) return { error: INTROUVABLE };
  const etat = etatDe(r);
  if (etat === "attente" && r.demandeurId !== user.id) return { error: "Pour une demande reçue, choisissez « Décliner »." };
  await prisma.rendezVousB2B.update({ where: { id }, data: { statut: "ANNULE", decideLe: new Date() } });
  rafraichir();
  return { error: null };
}

/** Note privée sur un rendez-vous (chacun la sienne). */
export async function noterRdv(id: unknown, note: unknown): Promise<Resultat> {
  const user = await membre();
  if (!user) return { error: SANS_ACCES };
  if (typeof id !== "string") return { error: INTROUVABLE };
  const texte = typeof note === "string" ? note.trim().slice(0, 1000) : "";
  const r = await prisma.rendezVousB2B.findUnique({ where: { id }, select: { demandeurId: true, destinataireId: true } });
  if (!r || ![r.demandeurId, r.destinataireId].includes(user.id)) return { error: INTROUVABLE };
  await prisma.rendezVousB2B.update({ where: { id }, data: r.demandeurId === user.id ? { noteDemandeur: texte } : { noteDestinataire: texte } });
  return { error: null };
}
