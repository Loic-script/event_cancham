import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/** Billets du gala : un code par compte (colonne code_billet), entrées enregistrées par le scanner. */
export type EtatScan = "ok" | "attente" | "deja" | "inconnu";

export type VerdictScan = { etat: EtatScan; code: string; userId?: number; nom?: string; ent?: string; role?: string; photo?: string | null; quand?: number };

export type EntreeVue = { userId: number; nom: string; detail: string; code: string; photo: string | null; t: number };

/** Ce que contient le QR code ou ce qui est saisi à la main : majuscules, sans espaces. */
export const normaliserCode = (brut: string) => brut.trim().toUpperCase().replace(/\s+/g, "");

const personne = { id: true, firstName: true, lastName: true, company: true, role: true, photo: true, statut: true, billetPaye: true, codeBillet: true } as const;

/**
 * Vérifie un billet et enregistre l'entrée s'il est valide et réglé. Une seule entrée par participant :
 * deux scanners qui lisent le même billet au même moment donnent « Entrée validée » puis « Déjà scanné ».
 */
export async function scanner(brut: string, adminId: number): Promise<VerdictScan> {
  const code = normaliserCode(brut);
  if (!code || code.length > 40) return { etat: "inconnu", code };
  const u = await prisma.user.findUnique({ where: { codeBillet: code }, select: { ...personne, entreeGala: { select: { scanneLe: true } } } });
  if (!u || u.statut !== "ACTIF") return { etat: "inconnu", code };
  const qui = { code, userId: u.id, nom: `${u.firstName} ${u.lastName}`.trim(), ent: u.company ?? "", role: u.role ?? "", photo: u.photo };
  if (u.entreeGala) return { etat: "deja", ...qui, quand: u.entreeGala.scanneLe.getTime() };
  if (!u.billetPaye) return { etat: "attente", ...qui };
  return enregistrerEntree(u.id, adminId, qui);
}

async function enregistrerEntree(userId: number, adminId: number, qui: Omit<VerdictScan, "etat">): Promise<VerdictScan> {
  try {
    const e = await prisma.entreeGala.create({ data: { userId, scanneParId: adminId } });
    return { etat: "ok", ...qui, quand: e.scanneLe.getTime() };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const e = await prisma.entreeGala.findUnique({ where: { userId }, select: { scanneLe: true } });
      return { etat: "deja", ...qui, quand: e?.scanneLe.getTime() };
    }
    throw error;
  }
}

/** Billet réglé à l'entrée : il est marqué payé et l'entrée est enregistrée. */
export async function encaisser(userId: number, adminId: number): Promise<VerdictScan> {
  const u = await prisma.user.update({ where: { id: userId }, data: { billetPaye: true }, select: personne });
  return enregistrerEntree(u.id, adminId, { code: u.codeBillet, userId: u.id, nom: `${u.firstName} ${u.lastName}`.trim(), ent: u.company ?? "", role: u.role ?? "", photo: u.photo });
}

export async function entreesGala(): Promise<EntreeVue[]> {
  const lignes = await prisma.entreeGala.findMany({ orderBy: { scanneLe: "desc" }, select: { scanneLe: true, user: { select: personne } } });
  return lignes.map(({ scanneLe, user: u }) => ({ userId: u.id, nom: `${u.firstName} ${u.lastName}`.trim(), detail: [u.role, u.company].filter(Boolean).join(" · "), code: u.codeBillet, photo: u.photo, t: scanneLe.getTime() }));
}

/** Comptes validés, donc titulaires d'un billet. */
export const nombreInscrits = () => prisma.user.count({ where: { statut: "ACTIF" } });
