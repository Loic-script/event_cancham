"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { EMAIL_PATTERN, MIN_PASSWORD_LENGTH, erreurCoordonnees, lireCoordonnees } from "@/lib/coordonnees";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { createSession, PAGE_ATTENTE } from "@/lib/session";

export type RegisterState = { error: string | null };

export async function register(_previous: RegisterState, formData: FormData): Promise<RegisterState> {
  const coordonnees = lireCoordonnees(formData);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const erreur = erreurCoordonnees(coordonnees);
  if (erreur) return { error: erreur };
  if (!EMAIL_PATTERN.test(email)) return { error: "L’adresse e-mail n’est pas valide." };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.` };
  }

  try {
    const user = await prisma.user.create({
      data: { email, passwordHash: await hashPassword(password), ...coordonnees },
      select: { id: true },
    });
    await createSession(user.id);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "Un compte existe déjà avec cette adresse e-mail." };
    }
    console.error("Inscription impossible :", error);
    return { error: "La base de données ne répond pas. Réessayez dans un instant." };
  }

  // L'espace s'ouvre une fois l'inscription validée par l'équipe (plus tard : après le paiement).
  redirect(PAGE_ATTENTE);
}
