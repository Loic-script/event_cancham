"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import type { Fiche } from "@/lib/traversee/store";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function modifierParticipant(userId: number, fiche: Fiche): Promise<{ error: string | null }> {
  const admin = await getCurrentUser();
  if (!admin || admin.acces !== "ADMIN") return { error: "Action réservée aux administrateurs." };

  const [firstName, ...reste] = fiche.nom.trim().split(/\s+/);
  const lastName = reste.join(" ");
  if (!firstName || !lastName) return { error: "Indiquez le prénom et le nom." };
  const email = fiche.email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) return { error: "Adresse e-mail invalide." };

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: firstName.slice(0, 60),
        lastName: lastName.slice(0, 60),
        email,
        company: fiche.ent.trim().slice(0, 80) || null,
        role: fiche.role.trim().slice(0, 80) || null,
        sector: fiche.sect.trim().slice(0, 60) || null,
        bio: fiche.act.trim().slice(0, 600) || null,
        phone: fiche.phone.trim().slice(0, 30) || null,
        website: fiche.website.trim().slice(0, 200) || null,
        billetPaye: fiche.billet === "paye",
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "Un autre compte utilise déjà cette adresse e-mail." };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { error: "Ce participant n’existe plus." };
    }
    throw error;
  }

  revalidatePath("/admin/participants");
  revalidatePath("/annuaire");
  return { error: null };
}

export async function supprimerParticipant(userId: number): Promise<{ error: string | null }> {
  const admin = await getCurrentUser();
  if (!admin || admin.acces !== "ADMIN") return { error: "Action réservée aux administrateurs." };
  if (admin.id === userId) return { error: "Vous ne pouvez pas supprimer votre propre compte." };

  const cible = await prisma.user.findUnique({ where: { id: userId }, select: { acces: true } });
  if (!cible) return { error: "Ce participant n’existe plus." };
  if (cible.acces === "ADMIN") return { error: "Ce compte est administrateur : retirez d’abord ses droits depuis la page Administrateurs." };

  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { error: "Ce participant n’existe plus." };
    }
    throw error;
  }

  revalidatePath("/admin/participants");
  revalidatePath("/annuaire");
  return { error: null };
}
