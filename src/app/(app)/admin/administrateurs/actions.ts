"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { baseCourriel } from "@/lib/alertes-admin";
import { courrielConfigure, courrielDisponible, envoyerCourriel } from "@/lib/courriel";
import { courrielNouvelAdmin, courrielPromotionAdmin } from "@/lib/courriels";
import { genererMotDePasse, hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export type AjoutState = { error: string | null; message: string | null };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const admin = await administrateur();
  if (!admin) return { error: "Action réservée aux administrateurs.", message: null };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  if (!EMAIL_PATTERN.test(email)) return { error: "Indiquez une adresse e-mail valide.", message: null };

  const createur = `${admin.firstName} ${admin.lastName}`.trim() || "L’équipe CanCham";
  const base = await baseCourriel();
  const existant = await prisma.user.findUnique({ where: { email }, select: { id: true, firstName: true, lastName: true, acces: true } });
  if (existant) {
    const nom = `${existant.firstName} ${existant.lastName}`.trim() || email;
    if (existant.acces === "ADMIN") return { error: `${nom} est déjà administrateur.`, message: null };
    // Promu, le compte est aussi validé : s'il perd un jour ses droits, il garde l'accès à l'espace participant.
    await prisma.user.update({ where: { id: existant.id }, data: { acces: "ADMIN", statut: "ACTIF", decisionLe: new Date() } });
    rafraichir();
    try {
      await envoyerCourriel(courrielPromotionAdmin({ email, prenom: existant.firstName, createur, base }));
      return { error: null, message: `${nom} est maintenant administrateur : un e-mail l’en informe.` };
    } catch (error) {
      console.error("E-mail de promotion non envoyé :", error);
      return { error: null, message: `${nom} est maintenant administrateur, mais l’e-mail d’information n’a pas pu partir : prévenez-le vous-même.` };
    }
  }

  if (!firstName || !lastName) return { error: "Aucun compte n’utilise cette adresse : indiquez le prénom et le nom pour le créer.", message: null };
  if (firstName.length > 60 || lastName.length > 60) return { error: "Le prénom ou le nom est trop long.", message: null };
  if (!courrielDisponible() || !base) {
    return { error: "L’envoi d’e-mails n’est pas configuré (RESEND_API_KEY, COURRIEL_EXPEDITEUR, APP_URL) : le mot de passe ne peut pas être envoyé.", message: null };
  }

  // Le mot de passe n'est connu que du nouvel administrateur : il le reçoit par e-mail.
  const motDePasse = genererMotDePasse();
  let cree: { id: number };
  try {
    cree = await prisma.user.create({
      data: { email, firstName, lastName, acces: "ADMIN", statut: "ACTIF", decisionLe: new Date(), passwordHash: await hashPassword(motDePasse) },
      select: { id: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "Un compte vient d’être créé avec cette adresse : réessayez.", message: null };
    throw error;
  }
  try {
    await envoyerCourriel(courrielNouvelAdmin({ email, prenom: firstName, createur, motDePasse, base }));
  } catch (error) {
    // Sans e-mail, personne ne connaîtrait le mot de passe : le compte n'est pas gardé.
    console.error("E-mail du nouvel administrateur non envoyé :", error);
    await prisma.user.delete({ where: { id: cree.id } }).catch(() => undefined);
    return { error: `L’e-mail n’a pas pu être envoyé à ${email} : le compte n’a pas été créé. Vérifiez l’adresse et réessayez.`, message: null };
  }
  rafraichir();
  return {
    error: null,
    message: courrielConfigure()
      ? `Compte administrateur créé : ${email} a reçu son mot de passe par e-mail.`
      : `Compte administrateur créé pour ${email} (développement : l’e-mail et le mot de passe sont affichés dans le terminal du serveur).`,
  };
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
