"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { baseCourriel } from "@/lib/alertes-admin";
import { supprimerCompte } from "@/lib/comptes";
import { courrielConfigure, courrielDisponible, envoyerCourriel } from "@/lib/courriel";
import { courrielNouvelAdmin, courrielPromotionAdmin } from "@/lib/courriels";
import { genererMotDePasse, hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { adressesSuperAdmins, estAdresseSuperAdmin, estSuperAdmin } from "@/lib/super-admin";

export type AjoutState = { error: string | null; message: string | null };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Gérer les administrateurs est réservé au super admin (adresses de SUPER_ADMINS). */
async function superAdmin() {
  const user = await getCurrentUser();
  return user && estSuperAdmin(user) ? user : null;
}

const RESERVE = `Seul le super admin${adressesSuperAdmins().length ? ` (${adressesSuperAdmins().join(", ")})` : ""} peut gérer les administrateurs.`;

function rafraichir() {
  revalidatePath("/admin/administrateurs");
  revalidatePath("/admin/participants");
  revalidatePath("/annuaire");
}

export async function ajouterAdmin(_previous: AjoutState, formData: FormData): Promise<AjoutState> {
  const admin = await superAdmin();
  if (!admin) return { error: RESERVE, message: null };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  if (!EMAIL_PATTERN.test(email)) return { error: "Indiquez une adresse e-mail valide.", message: null };

  const base = await baseCourriel();
  if (!courrielDisponible() || !base) {
    return { error: "L’envoi d’e-mails n’est pas configuré (RESEND_API_KEY, COURRIEL_EXPEDITEUR, APP_URL) : le mot de passe ne peut pas être envoyé.", message: null };
  }
  const createur = `${admin.firstName} ${admin.lastName}`.trim() || "L’équipe CanCham";
  // Le mot de passe n'est connu que du destinataire : il le reçoit par e-mail.
  const motDePasse = genererMotDePasse();
  const passwordHash = await hashPassword(motDePasse);
  const enDev = courrielConfigure() ? "" : " (développement : l’e-mail est affiché dans le terminal du serveur)";

  const existant = await prisma.user.findUnique({ where: { email }, select: { id: true, firstName: true, lastName: true, acces: true, statut: true, decisionLe: true, passwordHash: true } });
  if (existant) {
    const nom = `${existant.firstName} ${existant.lastName}`.trim() || email;
    if (existant.acces === "ADMIN") return { error: `${nom} est déjà administrateur.`, message: null };
    // Promu, le compte est aussi validé : s'il perd un jour ses droits, il garde l'accès à l'espace participant.
    await prisma.user.update({ where: { id: existant.id }, data: { acces: "ADMIN", statut: "ACTIF", decisionLe: new Date(), passwordHash } });
    try {
      await envoyerCourriel(courrielPromotionAdmin({ email, prenom: existant.firstName, createur, motDePasse, base }));
    } catch (error) {
      console.error("E-mail de promotion non envoyé :", error);
      await prisma.user.update({ where: { id: existant.id }, data: { acces: existant.acces, statut: existant.statut, decisionLe: existant.decisionLe, passwordHash: existant.passwordHash } });
      return { error: `L’e-mail n’a pas pu être envoyé à ${email} : ${nom} reste membre et garde son mot de passe. Réessayez.`, message: null };
    }
    rafraichir();
    return { error: null, message: `${nom} est maintenant administrateur : son nouveau mot de passe lui a été envoyé par e-mail${enDev}.` };
  }

  if (!firstName || !lastName) return { error: "Aucun compte n’utilise cette adresse : indiquez le prénom et le nom pour le créer.", message: null };
  if (firstName.length > 60 || lastName.length > 60) return { error: "Le prénom ou le nom est trop long.", message: null };

  let cree: { id: number };
  try {
    cree = await prisma.user.create({
      data: { email, firstName, lastName, acces: "ADMIN", statut: "ACTIF", decisionLe: new Date(), passwordHash },
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
  return { error: null, message: `Compte administrateur créé : ${email} a reçu son mot de passe par e-mail${enDev}.` };
}

/** Vérifie que le super admin peut agir sur ce compte administrateur. */
async function cibleModifiable(admin: { id: number }, userId: number) {
  if (admin.id === userId) return { error: "Vous ne pouvez pas agir sur votre propre compte ici." };
  const cible = await prisma.user.findUnique({ where: { id: userId }, select: { acces: true, email: true } });
  if (!cible || cible.acces !== "ADMIN") return { error: "Ce compte n’est plus administrateur." };
  if (estAdresseSuperAdmin(cible.email)) return { error: "Un super admin ne peut pas être modifié depuis la plateforme." };
  return { error: null };
}

export async function retirerAdmin(userId: number): Promise<{ error: string | null }> {
  const admin = await superAdmin();
  if (!admin) return { error: RESERVE };
  const { error } = await cibleModifiable(admin, userId);
  if (error) return { error };

  const resultat = await prisma.user.updateMany({ where: { id: userId, acces: "ADMIN" }, data: { acces: "MEMBRE" } });
  if (!resultat.count) return { error: "Ce compte n’est plus administrateur." };
  rafraichir();
  return { error: null };
}

export type DonneesAdmin = { firstName?: unknown; lastName?: unknown; email?: unknown; phone?: unknown; company?: unknown; role?: unknown };

const PHONE_PATTERN = /^\+?[\d\s().-]{7,20}$/;

/** Le super admin modifie l'identité et les coordonnées d'un administrateur (pas d'un super admin). */
export async function modifierAdmin(userId: number, d: DonneesAdmin): Promise<{ error: string | null }> {
  const admin = await superAdmin();
  if (!admin) return { error: RESERVE };
  const { error } = await cibleModifiable(admin, userId);
  if (error) return { error };

  const champ = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const firstName = champ(d.firstName);
  const lastName = champ(d.lastName);
  const email = champ(d.email).toLowerCase();
  const phone = champ(d.phone);
  const company = champ(d.company);
  const role = champ(d.role);
  if (!firstName || !lastName) return { error: "Indiquez le prénom et le nom." };
  if (firstName.length > 60 || lastName.length > 60) return { error: "Le prénom ou le nom est trop long." };
  if (!EMAIL_PATTERN.test(email)) return { error: "Indiquez une adresse e-mail valide." };
  if (estAdresseSuperAdmin(email)) return { error: "Cette adresse est réservée au super admin." };
  if (phone && (!PHONE_PATTERN.test(phone) || phone.replace(/\D/g, "").length < 7)) return { error: "Le numéro de téléphone n’est pas valide (exemple : +261 34 00 000 00)." };
  if (company.length > 80 || role.length > 80) return { error: "L’entreprise ou le rôle est trop long." };

  try {
    await prisma.user.update({ where: { id: userId }, data: { firstName, lastName, email, phone: phone || null, company: company || null, role: role || null } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { error: "Un autre compte utilise déjà cette adresse e-mail." };
    throw e;
  }
  rafraichir();
  return { error: null };
}

/** Supprime définitivement le compte d'un administrateur (pas d'un super admin). */
export async function supprimerAdmin(userId: number): Promise<{ error: string | null }> {
  const admin = await superAdmin();
  if (!admin) return { error: RESERVE };
  const { error } = await cibleModifiable(admin, userId);
  if (error) return { error };

  try {
    await supprimerCompte(userId);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") return { error: "Ce compte n’existe plus." };
    throw e;
  }
  rafraichir();
  return { error: null };
}
