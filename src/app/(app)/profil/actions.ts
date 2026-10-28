"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { hashPassword, verifierMotDePasseSaisi } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { supprimerCompte } from "@/lib/comptes";
import { destroySession, fermerAutresSessions, getCurrentUser } from "@/lib/session";
import { estAdresseSuperAdmin, estSuperAdmin } from "@/lib/super-admin";

const LIMITES = { firstName: 60, lastName: 60, company: 80, role: 80, sector: 60, bio: 600, phone: 30, website: 200, city: 80 } as const;

type Champ = keyof typeof LIMITES;

export async function enregistrerProfil(champs: Partial<Record<Champ, string>>): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  const data: Prisma.UserUpdateInput = {};
  for (const [cle, max] of Object.entries(LIMITES) as [Champ, number][]) {
    const valeur = champs[cle];
    if (typeof valeur !== "string") continue;
    const propre = valeur.trim().slice(0, max);
    if (cle === "firstName" || cle === "lastName") {
      if (propre) data[cle] = propre;
    } else {
      data[cle] = propre || null;
    }
  }
  if (!Object.keys(data).length) return { ok: true };

  await prisma.user.update({ where: { id: user.id }, data });
  revalidatePath("/annuaire");
  revalidatePath("/admin/participants");
  return { ok: true };
}

export type CompteState = { error: string | null; message: string | null };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 200;
const SESSION_EXPIREE: CompteState = { error: "Votre session a expiré : reconnectez-vous.", message: null };

async function motDePasseCorrect(userId: number, motDePasse: string) {
  const compte = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  return !!compte && (await verifierMotDePasseSaisi(motDePasse, compte.passwordHash));
}

/** Prénom, nom et adresse de connexion. Changer d'adresse demande le mot de passe actuel. */
export async function modifierIdentifiants(_previous: CompteState, formData: FormData): Promise<CompteState> {
  const user = await getCurrentUser();
  if (!user) return SESSION_EXPIREE;

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const motDePasse = String(formData.get("motDePasse") ?? "");

  if (!firstName || !lastName) return { error: "Renseignez votre prénom et votre nom.", message: null };
  if (firstName.length > LIMITES.firstName || lastName.length > LIMITES.lastName) {
    return { error: "Le prénom et le nom ne doivent pas dépasser 60 caractères.", message: null };
  }
  if (!EMAIL_PATTERN.test(email)) return { error: "Indiquez une adresse e-mail valide (exemple : nom@entreprise.mg).", message: null };

  const nouvelleAdresse = email !== user.email;
  if (nouvelleAdresse && estAdresseSuperAdmin(user.email)) return { error: "L’adresse du super admin est fixée par la configuration du serveur (SUPER_ADMINS).", message: null };
  if (nouvelleAdresse && estAdresseSuperAdmin(email)) return { error: "Cette adresse e-mail est déjà utilisée par un autre compte.", message: null };
  if (nouvelleAdresse) {
    if (!motDePasse) return { error: "Saisissez votre mot de passe actuel pour changer d’adresse e-mail.", message: null };
    if (!(await motDePasseCorrect(user.id, motDePasse))) return { error: "Le mot de passe actuel est incorrect.", message: null };
  }

  try {
    await prisma.user.update({ where: { id: user.id }, data: { firstName, lastName, email } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "Cette adresse e-mail est déjà utilisée par un autre compte.", message: null };
    }
    throw error;
  }

  revalidatePath("/", "layout");
  return {
    error: null,
    message: nouvelleAdresse ? `Informations enregistrées. Connectez-vous désormais avec ${email}.` : "Informations enregistrées.",
  };
}

const PHONE_PATTERN = /^\+?[\d\s().-]{7,20}$/;

/** Coordonnées du profil (participants) : adresse de connexion, téléphone et site web. Changer d'adresse demande le mot de passe actuel. */
export async function modifierCoordonnees(_previous: CompteState, formData: FormData): Promise<CompteState> {
  const user = await getCurrentUser();
  if (!user) return SESSION_EXPIREE;

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  let website = String(formData.get("website") ?? "").trim();
  const motDePasse = String(formData.get("motDePasse") ?? "");

  if (!EMAIL_PATTERN.test(email)) return { error: "Indiquez une adresse e-mail valide (exemple : nom@entreprise.mg).", message: null };
  if (phone && (!PHONE_PATTERN.test(phone) || phone.replace(/\D/g, "").length < 7)) return { error: "Le numéro de téléphone n’est pas valide (exemple : +261 34 00 000 00).", message: null };
  if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;
  if (website && (!/^https?:\/\/[^\s/]+\.[^\s]+$/i.test(website) || website.length > LIMITES.website)) return { error: "L’adresse du site web n’est pas valide.", message: null };

  const nouvelleAdresse = email !== user.email;
  if (nouvelleAdresse) {
    if (estAdresseSuperAdmin(user.email)) return { error: "L’adresse du super admin est fixée par la configuration du serveur (SUPER_ADMINS).", message: null };
    if (estAdresseSuperAdmin(email)) return { error: "Cette adresse e-mail est déjà utilisée par un autre compte.", message: null };
    if (!motDePasse) return { error: "Saisissez votre mot de passe actuel pour changer d’adresse e-mail.", message: null };
    if (!(await motDePasseCorrect(user.id, motDePasse))) return { error: "Le mot de passe actuel est incorrect.", message: null };
  }

  try {
    await prisma.user.update({ where: { id: user.id }, data: { email, phone: phone || null, website: website || null } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "Cette adresse e-mail est déjà utilisée par un autre compte.", message: null };
    throw error;
  }
  revalidatePath("/", "layout");
  return { error: null, message: nouvelleAdresse ? `Coordonnées enregistrées. Connectez-vous désormais avec ${email}.` : "Coordonnées enregistrées." };
}

/** Change le mot de passe après vérification de l'actuel, puis déconnecte les autres appareils. */
export async function changerMotDePasse(_previous: CompteState, formData: FormData): Promise<CompteState> {
  const user = await getCurrentUser();
  if (!user) return SESSION_EXPIREE;

  const actuel = String(formData.get("actuel") ?? "");
  const nouveau = String(formData.get("nouveau") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (!actuel) return { error: "Saisissez votre mot de passe actuel.", message: null };
  if (nouveau.length < MIN_PASSWORD_LENGTH) {
    return { error: `Le nouveau mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`, message: null };
  }
  if (nouveau.length > MAX_PASSWORD_LENGTH) return { error: "Le nouveau mot de passe est trop long.", message: null };
  if (nouveau !== confirmation) return { error: "Les deux nouveaux mots de passe ne correspondent pas.", message: null };
  if (!(await motDePasseCorrect(user.id, actuel))) return { error: "Le mot de passe actuel est incorrect.", message: null };
  if (nouveau === actuel) return { error: "Choisissez un mot de passe différent de l’actuel.", message: null };

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(nouveau) } });
  const deconnectes = await fermerAutresSessions(user.id);

  return {
    error: null,
    message: deconnectes
      ? `Mot de passe modifié. ${deconnectes} autre${deconnectes > 1 ? "s" : ""} appareil${deconnectes > 1 ? "s ont" : " a"} été déconnecté${deconnectes > 1 ? "s" : ""}.`
      : "Mot de passe modifié.",
  };
}

export type SuppressionState = { error: string | null };

const MOT_DE_CONFIRMATION = "SUPPRIMER";

/** La personne supprime elle-même son compte, après avoir tapé SUPPRIMER. Le super admin ne le peut pas. */
export async function supprimerMonCompte(_previous: SuppressionState, formData: FormData): Promise<SuppressionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Votre session a expiré : reconnectez-vous." };
  if (String(formData.get("confirmation") ?? "").trim().toUpperCase() !== MOT_DE_CONFIRMATION) return { error: `Tapez ${MOT_DE_CONFIRMATION} pour confirmer.` };
  if (estSuperAdmin(user)) return { error: "Le compte du super admin ne peut pas être supprimé depuis la plateforme." };

  try {
    await supprimerCompte(user.id);
  } catch (error) {
    console.error("Suppression du compte impossible :", error);
    return { error: "La suppression n’a pas abouti. Réessayez dans un instant." };
  }
  await destroySession();
  revalidatePath("/annuaire");
  revalidatePath("/admin/participants");
  redirect("/connexion?compte=supprime");
}

/** Cadrage vertical de la couverture (0 : haut de l'image, 100 : bas), réglé en la faisant glisser. */
export async function positionnerCouverture(position: unknown): Promise<{ error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Votre session a expiré : reconnectez-vous." };
  const p = Number(position);
  if (!Number.isFinite(p)) return { error: "Position invalide." };
  await prisma.user.update({ where: { id: user.id }, data: { couverturePosition: Math.round(Math.min(100, Math.max(0, p))) } });
  revalidatePath("/", "layout");
  return { error: null };
}
