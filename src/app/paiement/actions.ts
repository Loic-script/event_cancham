"use server";

import { redirect } from "next/navigation";
import { LOGIN_PATH } from "@/lib/auth";
import { estMode, lancerPaiement } from "@/lib/paiements";
import { aAccesEspace, getCurrentUser } from "@/lib/session";

export type PaiementState = { error: string | null };

/** Choix d'un moyen de paiement : ouvre le paiement chez Vanilla Pay et envoie le navigateur à l'adresse obtenue. */
export async function payer(_previous: PaiementState, formData: FormData): Promise<PaiementState> {
  const user = await getCurrentUser();
  if (!user) redirect(LOGIN_PATH);
  if (aAccesEspace(user)) redirect("/");
  if (user.statut !== "EN_ATTENTE") return { error: "Votre compte ne peut pas régler de billet. Écrivez à l’équipe CanCham." };
  const mode = formData.get("mode");
  if (!estMode(mode)) return { error: "Choisissez un moyen de paiement." };
  const r = await lancerPaiement(user.id, mode);
  if ("error" in r) return { error: r.error };
  redirect(r.url);
}
