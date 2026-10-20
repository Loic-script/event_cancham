import { prisma } from "@/lib/prisma";
import { formatDuree, type EtatSouvenir, type SouvenirVue } from "@/lib/traversee/livre";

/** Livre d'or vidéo : souvenirs déposés par les participants, publiés après validation par l'équipe. */
const ETATS: Record<string, EtatSouvenir> = { ATTENTE: "attente", VALIDE: "valide", REFUSE: "refuse" };

const selection = { id: true, video: true, duree: true, texte: true, statut: true, creeLe: true, auteur: { select: { firstName: true, lastName: true, company: true } } } as const;

function vue(l: { id: string; video: string; duree: number | null; texte: string; statut: string; creeLe: Date; auteur: { firstName: string; lastName: string; company: string | null } }): SouvenirVue {
  return { id: l.id, video: l.video, duree: formatDuree(l.duree), nom: `${l.auteur.firstName} ${l.auteur.lastName}`.trim(), ent: l.auteur.company ?? "", texte: l.texte, etat: ETATS[l.statut] ?? "attente", t: l.creeLe.getTime() };
}

/** Pages publiées, de la plus ancienne à la plus récente (on feuillette dans l'ordre d'arrivée). */
export async function souvenirsPublies(): Promise<SouvenirVue[]> {
  return (await prisma.souvenirLivre.findMany({ where: { statut: "VALIDE" }, orderBy: { creeLe: "asc" }, select: selection })).map(vue);
}

/** Souvenirs de ce participant pas encore publiés (en attente ou non retenus). */
export async function mesSouvenirs(userId: number): Promise<SouvenirVue[]> {
  return (await prisma.souvenirLivre.findMany({ where: { auteurId: userId, statut: { not: "VALIDE" } }, orderBy: { creeLe: "desc" }, select: selection })).map(vue);
}

/** Back-office : tous les souvenirs, ceux à valider d'abord. */
export async function souvenirsAdmin(): Promise<SouvenirVue[]> {
  const lignes = (await prisma.souvenirLivre.findMany({ orderBy: { creeLe: "desc" }, select: selection })).map(vue);
  return [...lignes.filter((l) => l.etat === "attente"), ...lignes.filter((l) => l.etat !== "attente")];
}
