"use server";

import { redirect } from "next/navigation";
import { LOGIN_PATH, safeNext } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";

export type LoginState = { error: string | null };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const decoyHash = hashPassword("mot-de-passe-de-comparaison");

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) return { error: "Renseignez votre adresse e-mail et votre mot de passe." };
  if (!EMAIL_PATTERN.test(email)) return { error: "L’adresse e-mail n’est pas valide." };

  let authenticated = false;
  let destination = next;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    authenticated = user ? await verifyPassword(password, user.passwordHash) : !(await verifyPassword(password, await decoyHash));
    if (authenticated && user) {
      await createSession(user.id);
      if (next === "/" && user.acces === "ADMIN") destination = "/admin";
    }
  } catch (error) {
    console.error("Connexion impossible :", error);
    return { error: "La base de données ne répond pas. Réessayez dans un instant." };
  }

  if (!authenticated) return { error: "Adresse e-mail ou mot de passe incorrect." };
  redirect(destination);
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect(LOGIN_PATH);
}
