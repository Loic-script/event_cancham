"use server";

import { revalidatePath } from "next/cache";
import { StatutCompte } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

/** Donne, refuse ou retire l'accès d'un membre à l'espace participant. */
export async function changerStatut(userId: number, statut: StatutCompte): Promise<{ error: string | null }> {
  const admin = await getCurrentUser();
  if (!admin || admin.acces !== "ADMIN") return { error: "Action réservée aux administrateurs." };
  if (!Number.isInteger(userId) || !Object.values(StatutCompte).includes(statut)) return { error: "Demande invalide." };

  const { count } = await prisma.user.updateMany({
    where: { id: userId, acces: "MEMBRE" },
    data: { statut, decisionLe: statut === "EN_ATTENTE" ? null : new Date() },
  });
  if (!count) return { error: "Ce compte est introuvable." };

  // Pastille du menu admin, annuaire et liste des participants.
  revalidatePath("/", "layout");
  return { error: null };
}
