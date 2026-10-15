"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { safeNext } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

export type RegisterState = { error: string | null };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_NAME_LENGTH = 60;
const MAX_COMPANY_LENGTH = 80;

export async function register(_previous: RegisterState, formData: FormData): Promise<RegisterState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const company = String(formData.get("company") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!firstName || !lastName) return { error: "Renseignez votre prénom et votre nom." };
  if (firstName.length > MAX_NAME_LENGTH || lastName.length > MAX_NAME_LENGTH || company.length > MAX_COMPANY_LENGTH) {
    return { error: "Un des champs est trop long." };
  }
  if (!EMAIL_PATTERN.test(email)) return { error: "L’adresse e-mail n’est pas valide." };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.` };
  }

  try {
    const user = await prisma.user.create({
      data: { email, passwordHash: await hashPassword(password), firstName, lastName, company: company || null },
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

  redirect(next);
}
