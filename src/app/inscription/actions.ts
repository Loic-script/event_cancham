"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { safeNext } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

export type RegisterState = { error: string | null };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[\d\s().-]{7,20}$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_NAME_LENGTH = 60;
const MAX_COMPANY_LENGTH = 80;
const MAX_ROLE_LENGTH = 80;

export async function register(_previous: RegisterState, formData: FormData): Promise<RegisterState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const company = String(formData.get("company") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!firstName || !lastName) return { error: "Renseignez votre prénom et votre nom." };
  if (!company || !role) return { error: "Renseignez votre entreprise et votre rôle." };
  if (
    firstName.length > MAX_NAME_LENGTH ||
    lastName.length > MAX_NAME_LENGTH ||
    company.length > MAX_COMPANY_LENGTH ||
    role.length > MAX_ROLE_LENGTH
  ) {
    return { error: "Un des champs est trop long." };
  }
  if (!EMAIL_PATTERN.test(email)) return { error: "L’adresse e-mail n’est pas valide." };
  if (!PHONE_PATTERN.test(phone) || phone.replace(/\D/g, "").length < 7) {
    return { error: "Le numéro de téléphone n’est pas valide (exemple : +261 34 00 000 00)." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.` };
  }

  try {
    const user = await prisma.user.create({
      data: { email, passwordHash: await hashPassword(password), firstName, lastName, company, role, phone },
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
