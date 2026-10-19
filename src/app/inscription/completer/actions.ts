"use server";

import { redirect } from "next/navigation";
import { LOGIN_PATH } from "@/lib/auth";
import { erreurCoordonnees, lireCoordonnees } from "@/lib/coordonnees";
import { prisma } from "@/lib/prisma";
import { aAccesEspace, getCurrentUser, PAGE_ATTENTE } from "@/lib/session";

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
  redirect(aAccesEspace(user) ? "/" : PAGE_ATTENTE);
}
