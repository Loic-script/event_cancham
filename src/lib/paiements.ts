import { randomInt } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { envoyerCourriel } from "@/lib/courriel";
import { courrielAlertePaiement, courrielRecuPaiement } from "@/lib/courriels";
import { prisma } from "@/lib/prisma";
import { urlPublique } from "@/lib/url";
import { ErreurVanillaPay, PRESTATAIRE_INJOIGNABLE, etatTransaction, lienOperateur, ouvrirPaiement, vanillaPayConfigure, type EtatTransaction, type ModeVanillaPay, type Operateur } from "@/lib/vanillapay";

/**
 * Règlement du billet par Vanilla Pay. Une tentative (table paiements) porte une référence propre à la plateforme ;
 * sa conclusion (notification signée ou vérification d'état par le serveur) ouvre l'accès du membre, une seule fois.
 */
export const MODES = {
  carte: { libelle: "Carte bancaire", modePaiement: "international" as ModeVanillaPay, operateur: null as Operateur | null },
  mvola: { libelle: "MVola", modePaiement: "mobile_money" as ModeVanillaPay, operateur: "MVOLA" as Operateur },
  orange_money: { libelle: "Orange Money", modePaiement: "mobile_money" as ModeVanillaPay, operateur: "ORANGE" as Operateur },
  airtel_money: { libelle: "Airtel Money", modePaiement: "mobile_money" as ModeVanillaPay, operateur: "AIRTEL" as Operateur },
} as const;

export type ModePaiement = keyof typeof MODES;

export const estMode = (v: unknown): v is ModePaiement => typeof v === "string" && Object.hasOwn(MODES, v);

/** Minimum accepté par Vanilla Pay. */
export const MONTANT_MINIMUM = 5000;

/** Prix du billet en ariary : PAIEMENT_MONTANT_AR (entier), 500 000 par défaut. */
export function montantBillet(): number {
  const n = Math.round(Number(process.env.PAIEMENT_MONTANT_AR ?? 500_000));
  return Number.isFinite(n) && n >= MONTANT_MINIMUM ? n : 500_000;
}

export const formatAriary = (n: number) => `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} Ar`;

/** Référence LT-2026-XXXXXX : six caractères sans ambiguïté (ni 0/O, ni 1/I/L). */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const PREFIXE_REFERENCE = "LT-2026-";

export function nouvelleReference(): string {
  return PREFIXE_REFERENCE + Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}

export const referenceValide = (v: unknown): v is string => typeof v === "string" && /^LT-\d{4}-[A-Z2-9]{6}$/.test(v);

export type Tentative = Prisma.PaiementGetPayload<{ select: typeof selection }>;

const selection = { id: true, reference: true, userId: true, montant: true, mode: true, statut: true, transaction: true, regleLe: true, creeLe: true } as const;

/** Reprend la tentative en cours du membre pour ce moyen, sinon en crée une (référence unique). */
export async function tentativePour(userId: number, mode: ModePaiement): Promise<Tentative> {
  const existante = await prisma.paiement.findFirst({ where: { userId, mode, statut: "en_cours" }, select: selection, orderBy: { creeLe: "desc" } });
  if (existante && existante.montant === montantBillet()) return existante;
  for (let essai = 0; essai < 5; essai++) {
    const reference = nouvelleReference();
    if (await prisma.paiement.findUnique({ where: { reference }, select: { id: true } })) continue;
    return prisma.paiement.create({ data: { reference, userId, montant: montantBillet(), mode }, select: selection });
  }
  throw new Error("Impossible de tirer une référence de paiement unique.");
}

/** Ouvre le paiement chez Vanilla Pay et renvoie l'adresse où envoyer le payeur (ou un message d'erreur clair). */
export async function lancerPaiement(userId: number, mode: ModePaiement): Promise<{ url: string } | { error: string }> {
  if (!vanillaPayConfigure()) return { error: "Le paiement en ligne n’est pas encore activé. Écrivez à l’équipe CanCham." };
  const tentative = await tentativePour(userId, mode);
  const base = await urlPublique();
  const m = MODES[mode];
  try {
    const { url, transaction } = await ouvrirPaiement({
      montant: tentative.montant,
      reference: tentative.reference,
      notifUrl: `${base}/api/paiements/vanillapay`,
      redirectUrl: `${base}/paiement/retour?ref=${tentative.reference}`,
      modePaiement: m.modePaiement,
    });
    if (transaction) await prisma.paiement.update({ where: { id: tentative.id }, data: { transaction } });
    return { url: m.operateur ? lienOperateur(url, m.operateur) : url };
  } catch (e) {
    if (e instanceof ErreurVanillaPay) {
      console.error(`Vanilla Pay, ouverture refusée (${tentative.reference}) :`, e.detail ?? e.message);
      return { error: e.message };
    }
    console.error(`Vanilla Pay, ouverture impossible (${tentative.reference}) :`, e);
    return { error: PRESTATAIRE_INJOIGNABLE };
  }
}

export type Resultat = { etat: EtatTransaction; transaction?: string | null; notification?: unknown; montantAriary: number | null };

export type Conclusion = "reussi" | "echoue" | "deja" | "en_cours" | "montant";

/**
 * Conclut une tentative à partir d'une notification signée ou d'une vérification d'état. Une seule fonction pour les deux :
 * la mise à jour conditionnelle « en_cours → reussi » garantit que l'accès n'est ouvert qu'une fois, même si la notification
 * et la page de retour concluent toutes deux. Les e-mails partent ensuite, hors transaction (prevenirPaiementReussi).
 */
export async function conclurePaiement(reference: string, r: Resultat): Promise<Conclusion> {
  if (r.etat === "en_cours") return "en_cours";
  const notification = r.notification === undefined ? undefined : (JSON.parse(JSON.stringify(r.notification)) as Prisma.InputJsonValue);
  const paiement = await prisma.paiement.findUnique({ where: { reference }, select: { id: true, montant: true, userId: true, mode: true, statut: true } });
  if (!paiement) return "deja";

  if (r.etat === "reussi" && r.montantAriary !== null && r.montantAriary !== paiement.montant) {
    // Montant différent de celui attendu : on n'ouvre rien, et on le note.
    const { count } = await prisma.paiement.updateMany({ where: { reference, statut: "en_cours" }, data: { statut: "echoue", notification, transaction: r.transaction ?? undefined } });
    if (count) await prisma.journal.create({ data: { acteur: `membre:${paiement.userId}`, action: "paiement_montant_different", details: `${reference} : reçu ${r.montantAriary} Ar, attendu ${paiement.montant} Ar` } });
    console.error(`Paiement ${reference} : montant reçu ${r.montantAriary} Ar différent du montant attendu ${paiement.montant} Ar.`);
    return "montant";
  }

  if (r.etat === "echoue") {
    const { count } = await prisma.paiement.updateMany({ where: { reference, statut: "en_cours" }, data: { statut: "echoue", notification, transaction: r.transaction ?? undefined } });
    return count ? "echoue" : "deja";
  }

  const maintenant = new Date();
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.paiement.updateMany({ where: { reference, statut: "en_cours" }, data: { statut: "reussi", regleLe: maintenant, notification, transaction: r.transaction ?? undefined } });
    if (!count) return "deja";
    const u = await tx.user.update({ where: { id: paiement.userId }, data: { statut: "ACTIF", billetPaye: true, payeLe: maintenant, paiementReference: reference, decisionLe: maintenant }, select: { email: true } });
    await tx.journal.create({ data: { acteur: u.email, action: "paiement_reussi", details: `${reference} · ${formatAriary(paiement.montant)} · ${MODES[paiement.mode as ModePaiement]?.libelle ?? paiement.mode}` } });
    return "reussi";
  });
}

const DATE_RECU = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Indian/Antananarivo" });

/** Reçu au membre et alerte à l'équipe, après un paiement réussi. Une erreur d'envoi est seulement journalisée. */
export async function prevenirPaiementReussi(reference: string): Promise<void> {
  try {
    const p = await prisma.paiement.findUnique({ where: { reference }, select: { montant: true, mode: true, regleLe: true, user: { select: { id: true, email: true, firstName: true, lastName: true, company: true } } } });
    if (!p || !p.regleLe) return;
    // Appelé après la réponse (after) : plus de requête sous la main, seule APP_URL fait foi pour les liens.
    const base = process.env.APP_URL?.trim().replace(/\/+$/, "") || null;
    const d = { email: p.user.email, prenom: p.user.firstName, nom: p.user.lastName, entreprise: p.user.company, reference, montant: formatAriary(p.montant), mode: MODES[p.mode as ModePaiement]?.libelle ?? p.mode, regleLe: DATE_RECU.format(p.regleLe), base };
    await envoyerCourriel(courrielRecuPaiement(d));
    const admins = (await prisma.user.findMany({ where: { acces: "ADMIN", id: { not: p.user.id } }, select: { email: true } })).map((a) => a.email);
    for (let i = 0; i < admins.length; i += 50) await envoyerCourriel(courrielAlertePaiement(d, admins.slice(i, i + 50)));
  } catch (error) {
    console.error(`E-mails du paiement ${reference} non envoyés :`, error);
  }
}

export async function tentativeDuMembre(userId: number, reference: string): Promise<Tentative | null> {
  return prisma.paiement.findFirst({ where: { reference, userId }, select: selection });
}

/** Au retour du payeur, si la notification n'est pas encore arrivée : l'état est demandé au prestataire, puis conclu. */
export async function verifierAuRetour(t: Tentative): Promise<Conclusion> {
  if (t.statut !== "en_cours") return t.statut === "reussi" ? "deja" : "echoue";
  if (!t.transaction || !vanillaPayConfigure()) return "en_cours";
  const mode = MODES[t.mode as ModePaiement];
  if (!mode) return "en_cours";
  try {
    const n = await etatTransaction(t.transaction, mode.modePaiement);
    return conclurePaiement(t.reference, { etat: n.etat, transaction: n.referenceVPI ?? n.referenceMM ?? t.transaction, notification: n.donnees, montantAriary: n.montantAriary });
  } catch (e) {
    console.error(`Vanilla Pay, état de ${t.reference} indisponible :`, e instanceof ErreurVanillaPay ? e.detail ?? e.message : e);
    return "en_cours";
  }
}
