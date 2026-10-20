"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { alerterNouvelleInscription, baseCourriel } from "@/lib/alertes-admin";
import { LOGIN_PATH } from "@/lib/auth";
import { erreurCoordonnees, lireCoordonnees, profilIncomplet } from "@/lib/coordonnees";
import { prisma } from "@/lib/prisma";
import { pageApresConnexion } from "@/lib/parcours";
import { getCurrentUser } from "@/lib/session";

export type CompleterState = { error: string | null };

export async function completerProfil(_previous: CompleterState, formData: FormData): Promise<CompleterState> {
  const user = await getCurrentUser();
  if (!user) redirect(LOGIN_PATH);

  const coordonnees = lireCoordonnees(formData);
  const erreur = erreurCoordonnees(coordonnees);
  if (erreur) return { error: erreur };

  try {
    await prisma.user.update({ where: { id: user.id }, data: coordonnees });
  } catch (error) {
    console.error("Profil non complété :", error);
    return { error: "La base de données ne répond pas. Réessayez dans un instant." };
  }
  // Inscription avec Google ou Facebook : les administrateurs sont prévenus une fois le profil complet.
  if (user.acces !== "ADMIN" && user.statut === "EN_ATTENTE" && profilIncomplet(user)) {
    const base = await baseCourriel();
    after(() => alerterNouvelleInscription(user.id, base));
  }
  redirect(await pageApresConnexion(user.id));
}
