import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { CRENEAUX, LIEUX } from "@/lib/traversee/data";

/**
 * Rendez-vous B2B du 18 décembre : une demande réserve le créneau et l'emplacement 48 heures, le temps que l'autre valide.
 * Sans réponse, elle expire et libère l'emplacement. Un emplacement ne sert qu'une fois par créneau ; une personne n'a qu'un rendez-vous par créneau.
 */
export const DELAI_REPONSE_MS = 48 * 3600 * 1000;

export type EtatRdv = "attente" | "confirme" | "decline" | "expire" | "annule";

export type RdvVue = {
  id: string;
  sens: "envoye" | "recu";
  avec: { id: number; nom: string; ent: string };
  ci: number;
  li: number;
  etat: EtatRdv;
  /** Fin de la réservation pour une demande en attente (ISO). */
  expireLe: string;
  note: string;
};

export type Disponibilites = { pris: [number, number][]; moiOccupe: number[]; autreOccupe: number[] };

const limiteAttente = () => new Date(Date.now() - DELAI_REPONSE_MS);

/** Rendez-vous qui occupent un emplacement et les deux personnes : confirmés, ou en attente depuis moins de 48 h. */
const actif = (): Prisma.RendezVousB2BWhereInput => ({ OR: [{ statut: "CONFIRME" }, { statut: "ATTENTE", creeLe: { gt: limiteAttente() } }] });

export function etatDe(r: { statut: string; creeLe: Date }): EtatRdv {
  if (r.statut === "ATTENTE") return r.creeLe.getTime() > Date.now() - DELAI_REPONSE_MS ? "attente" : "expire";
  return r.statut === "CONFIRME" ? "confirme" : r.statut === "DECLINE" ? "decline" : "annule";
}

export const creneauValide = (ci: unknown): ci is number => Number.isInteger(ci) && (ci as number) >= 0 && (ci as number) < CRENEAUX.length;
export const lieuValide = (li: unknown): li is number => Number.isInteger(li) && (li as number) >= 0 && (li as number) < LIEUX.length;

const personne = { select: { id: true, firstName: true, lastName: true, company: true } } as const;
const nom = (u: { firstName: string; lastName: string }) => `${u.firstName} ${u.lastName}`.trim();

/** Tous les rendez-vous d'un participant (envoyés et reçus), par créneau. */
export async function rdvDe(userId: number): Promise<RdvVue[]> {
  const lignes = await prisma.rendezVousB2B.findMany({
    where: { OR: [{ demandeurId: userId }, { destinataireId: userId }], statut: { not: "ANNULE" } },
    orderBy: [{ creneau: "asc" }, { creeLe: "desc" }],
    select: { id: true, demandeurId: true, creneau: true, lieu: true, statut: true, creeLe: true, noteDemandeur: true, noteDestinataire: true, demandeur: personne, destinataire: personne },
  });
  return lignes.map((r) => {
    const envoye = r.demandeurId === userId;
    const autre = envoye ? r.destinataire : r.demandeur;
    return {
      id: r.id,
      sens: envoye ? "envoye" : "recu",
      avec: { id: autre.id, nom: nom(autre), ent: autre.company ?? "" },
      ci: r.creneau,
      li: r.lieu,
      etat: etatDe(r),
      expireLe: new Date(r.creeLe.getTime() + DELAI_REPONSE_MS).toISOString(),
      note: envoye ? r.noteDemandeur : r.noteDestinataire,
    };
  });
}

/** Emplacements pris par créneau, et créneaux où l'un ou l'autre a déjà un rendez-vous. */
export async function disponibilites(moi: number, autre: number, sauf?: string): Promise<Disponibilites> {
  const lignes = await prisma.rendezVousB2B.findMany({ where: { ...actif(), ...(sauf ? { id: { not: sauf } } : {}) }, select: { creneau: true, lieu: true, demandeurId: true, destinataireId: true } });
  const occupe = (id: number) => [...new Set(lignes.filter((r) => r.demandeurId === id || r.destinataireId === id).map((r) => r.creneau))];
  return { pris: lignes.map((r) => [r.creneau, r.lieu]), moiOccupe: occupe(moi), autreOccupe: occupe(autre) };
}

/** Verrous de la transaction : l'emplacement et les deux personnes (toujours dans le même ordre, sans interblocage). */
async function verrouiller(tx: Prisma.TransactionClient, ci: number, li: number, personnes: number[]) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${7_700_000 + ci * 10 + li})`;
  for (const id of [...personnes].sort((a, b) => a - b)) await tx.$executeRaw`SELECT pg_advisory_xact_lock(${8_800_000 + id})`;
}

/** Vérifie dans la transaction que l'emplacement et les deux personnes sont libres à ce créneau. */
async function conflit(tx: Prisma.TransactionClient, ci: number, li: number, personnes: number[], sauf?: string): Promise<string | null> {
  const autres = { ...actif(), creneau: ci, ...(sauf ? { id: { not: sauf } } : {}) };
  if (await tx.rendezVousB2B.count({ where: { ...autres, lieu: li } })) return "Cet emplacement vient d’être réservé. Choisissez-en un autre.";
  for (const id of personnes) {
    // AND : le filtre « actif » a lui-même un OR, qu'un second OR au même niveau écraserait (une demande déclinée bloquerait encore la personne).
    if (await tx.rendezVousB2B.count({ where: { AND: [autres, { OR: [{ demandeurId: id }, { destinataireId: id }] }] } })) return "Un rendez-vous existe déjà à cette heure. Choisissez un autre créneau.";
  }
  return null;
}

/** Nouvelle demande (en attente). */
export async function creerDemande(demandeurId: number, destinataireId: number, ci: number, li: number): Promise<string | null> {
  return prisma.$transaction(async (tx) => {
    await verrouiller(tx, ci, li, [demandeurId, destinataireId]);
    const erreur = await conflit(tx, ci, li, [demandeurId, destinataireId]);
    if (erreur) return erreur;
    await tx.rendezVousB2B.create({ data: { demandeurId, destinataireId, creneau: ci, lieu: li } });
    return null;
  });
}

/** Le destinataire valide une demande encore en attente (l'emplacement lui était réservé). */
export async function confirmer(id: string, destinataireId: number): Promise<string | null> {
  return prisma.$transaction(async (tx) => {
    const r = await tx.rendezVousB2B.findUnique({ where: { id }, select: { demandeurId: true, destinataireId: true, creneau: true, lieu: true, statut: true, creeLe: true } });
    if (!r || r.destinataireId !== destinataireId) return "Cette demande n’existe plus.";
    if (etatDe(r) !== "attente") return "Cette demande a expiré ou a déjà reçu une réponse.";
    await verrouiller(tx, r.creneau, r.lieu, [r.demandeurId, r.destinataireId]);
    const erreur = await conflit(tx, r.creneau, r.lieu, [r.demandeurId, r.destinataireId], id);
    if (erreur) return erreur;
    await tx.rendezVousB2B.update({ where: { id }, data: { statut: "CONFIRME", decideLe: new Date() } });
    return null;
  });
}

/** Demandes reçues en attente et réponses récentes à mes demandes : pour la cloche. */
export async function notificationsRdv(userId: number) {
  const depuis = new Date(Date.now() - 7 * 86_400_000);
  const lignes = await prisma.rendezVousB2B.findMany({
    where: {
      OR: [
        { destinataireId: userId, statut: "ATTENTE", creeLe: { gt: limiteAttente() } },
        { demandeurId: userId, statut: { in: ["CONFIRME", "DECLINE"] }, decideLe: { gt: depuis } },
      ],
    },
    orderBy: { creeLe: "desc" },
    take: 20,
    select: { id: true, demandeurId: true, creneau: true, lieu: true, statut: true, creeLe: true, decideLe: true, demandeur: personne, destinataire: personne },
  });
  return lignes.map((r) => {
    const recu = r.demandeurId !== userId;
    const autre = recu ? r.demandeur : r.destinataire;
    return {
      id: `${r.id}-${r.statut}`,
      nom: nom(autre),
      ent: autre.company ?? "",
      quand: `${CRENEAUX[r.creneau] ?? ""}, ${LIEUX[r.lieu]?.nom ?? ""}`,
      genre: recu ? ("demande" as const) : r.statut === "CONFIRME" ? ("confirme" as const) : ("decline" as const),
      t: (recu ? r.creeLe : r.decideLe ?? r.creeLe).getTime(),
    };
  });
}

export type NotifRdv = Awaited<ReturnType<typeof notificationsRdv>>[number];
