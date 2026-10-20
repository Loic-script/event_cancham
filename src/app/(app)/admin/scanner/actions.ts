"use server";

import { revalidatePath } from "next/cache";
import { encaisser, scanner, type VerdictScan } from "@/lib/billets";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

type Reponse = { error: string | null; verdict?: VerdictScan };

async function admin() {
  const user = await getCurrentUser();
  return user && user.acces === "ADMIN" ? user : null;
}

const RESERVE = "Scanner réservé aux administrateurs.";

export async function scannerBillet(code: unknown): Promise<Reponse> {
  const user = await admin();
  if (!user) return { error: RESERVE };
  if (typeof code !== "string") return { error: "Code illisible." };
  const verdict = await scanner(code, user.id);
  if (verdict.etat === "ok") revalidatePath("/admin/scanner");
  return { error: null, verdict };
}

/** Paiement reçu à l'entrée : billet marqué payé, entrée validée. */
export async function encaisserEtValider(userId: unknown): Promise<Reponse> {
  const user = await admin();
  if (!user) return { error: RESERVE };
  if (!Number.isInteger(userId)) return { error: "Participant introuvable." };
  const existe = await prisma.user.count({ where: { id: userId as number, statut: "ACTIF" } });
  if (!existe) return { error: "Participant introuvable." };
  const verdict = await encaisser(userId as number, user.id);
  revalidatePath("/admin/scanner");
  revalidatePath("/admin/participants");
  return { error: null, verdict };
}

/** Remise à zéro des entrées (après une répétition, par exemple). */
export async function effacerEntrees(): Promise<{ error: string | null }> {
  if (!(await admin())) return { error: RESERVE };
  await prisma.entreeGala.deleteMany({});
  revalidatePath("/admin/scanner");
  return { error: null };
}
