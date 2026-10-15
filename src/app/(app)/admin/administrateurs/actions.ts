"use server";

import { revalidatePath } from "next/cache";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export type AjoutState = { error: string | null; message: string | null };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

async function administrateur() {
  const user = await getCurrentUser();
  return user && user.acces === "ADMIN" ? user : null;
}

function rafraichir() {
  revalidatePath("/admin/administrateurs");
  revalidatePath("/admin/participants");
  revalidatePath("/annuaire");
}

export async function ajouterAdmin(_previous: AjoutState, formData: FormData): Promise<AjoutState> {
  if (!(await administrateur())) return { error: "Action réservée aux administrateurs.", message: null };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!EMAIL_PATTERN.test(email)) return { error: "Indiquez une adresse e-mail valide.", message: null };

  const existant = await prisma.user.findUnique({ where: { email }, select: { id: true, firstName: true, lastName: true, acces: true } });
  if (existant) {
    if (existant.acces === "ADMIN") return { error: `${existant.firstName} ${existant.lastName} est déjà administrateur.`, message: null };
    await prisma.user.update({ where: { id: existant.id }, data: { acces: "ADMIN" } });
    rafraichir();
    return { error: null, message: `${existant.firstName} ${existant.lastName} est maintenant administrateur.` };
  }

  if (!firstName || !lastName) return { error: "Aucun compte n’utilise cette adresse : indiquez le prénom et le nom pour le créer.", message: null };
  if (firstName.length > 60 || lastName.length > 60) return { error: "Le prénom ou le nom est trop long.", message: null };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Le mot de passe provisoire doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`, message: null };
  }

  await prisma.user.create({
    data: { email, firstName, lastName, acces: "ADMIN", passwordHash: await hashPassword(password) },
  });
  rafraichir();
  return { error: null, message: `Compte administrateur créé pour ${email}. Transmettez-lui son mot de passe provisoire.` };
}

export async function retirerAdmin(userId: number): Promise<{ error: string | null }> {
  const admin = await administrateur();
  if (!admin) return { error: "Action réservée aux administrateurs." };
  if (admin.id === userId) return { error: "Vous ne pouvez pas retirer vos propres droits." };

  const nombre = await prisma.user.count({ where: { acces: "ADMIN" } });
  if (nombre <= 1) return { error: "Il doit rester au moins un administrateur." };

  const resultat = await prisma.user.updateMany({ where: { id: userId, acces: "ADMIN" }, data: { acces: "MEMBRE" } });
  if (!resultat.count) return { error: "Ce compte n’est plus administrateur." };
  rafraichir();
  return { error: null };
}
