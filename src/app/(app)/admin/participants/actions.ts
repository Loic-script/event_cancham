"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { baseCourriel } from "@/lib/alertes-admin";
import { supprimerCompte } from "@/lib/comptes";
import { erreurCoordonnees, lireCoordonnees } from "@/lib/coordonnees";
import { courrielConfigure, courrielDisponible, envoyerCourriel } from "@/lib/courriel";
import { courrielNouveauMembre } from "@/lib/courriels";
import { genererMotDePasse, hashPassword } from "@/lib/password";
import { creerJeton, DUREE_CREATION_MINUTES } from "@/lib/reinitialisation";
import type { Fiche } from "@/lib/traversee/store";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { estAdresseSuperAdmin } from "@/lib/super-admin";
import { urlPublique } from "@/lib/url";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CreationState = { error: string | null; message: string | null; lien: string | null; email: string | null };

/**
 * « Créer un utilisateur » de l'annuaire : un compte membre complet, accès ouvert sans paiement en ligne.
 * Le membre reçoit par e-mail un lien (7 jours, usage unique) vers la page où il crée son mot de passe ;
 * sans envoi possible, le lien est rendu une seule fois à l'administrateur pour qu'il le transmette.
 */
export async function creerParticipant(_previous: CreationState, formData: FormData): Promise<CreationState> {
  const echec = (error: string): CreationState => ({ error, message: null, lien: null, email: null });
  const admin = await getCurrentUser();
  if (!admin || admin.acces !== "ADMIN") return echec("Action réservée aux administrateurs.");

  const coordonnees = lireCoordonnees(formData);
  const champ = (nom: string) => String(formData.get(nom) ?? "").trim();
  const email = champ("email").toLowerCase();
  const sector = champ("sector");
  const bio = champ("bio");
  const website = champ("website");
  const city = champ("city");
  const billetPaye = champ("billet") !== "attente";

  const erreur = erreurCoordonnees(coordonnees);
  if (erreur) return echec(erreur);
  if (!EMAIL_PATTERN.test(email)) return echec("Adresse e-mail invalide.");
  if (estAdresseSuperAdmin(email)) return echec("Cette adresse est réservée au super admin.");
  if (sector.length > 60 || bio.length > 600 || website.length > 200 || city.length > 80) return echec("Un des champs est trop long.");

  // Mot de passe inconnu de tous jusqu'à ce que le membre crée le sien par le lien.
  const motDePasse = genererMotDePasse();
  const maintenant = new Date();
  let cree: { id: number };
  try {
    cree = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(motDePasse),
        ...coordonnees,
        sector: sector || null,
        bio: bio || null,
        website: website || null,
        city: city || null,
        acces: "MEMBRE",
        statut: "ACTIF",
        decisionLe: maintenant,
        billetPaye,
      },
      select: { id: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return echec("Un compte existe déjà avec cette adresse e-mail.");
    throw error;
  }

  revalidatePath("/admin/participants");
  revalidatePath("/annuaire");
  const nom = `${coordonnees.firstName} ${coordonnees.lastName}`;
  const base = (await baseCourriel()) ?? (await urlPublique());
  const jeton = await creerJeton(cree.id, { dureeMinutes: DUREE_CREATION_MINUTES, sansDelai: true });
  const lien = `${base}/creer-mot-de-passe/${jeton}`;
  if (courrielDisponible() && (await baseCourriel())) {
    try {
      const createur = `${admin.firstName} ${admin.lastName}`.trim() || "L’équipe CanCham";
      await envoyerCourriel(courrielNouveauMembre({ email, prenom: coordonnees.firstName, createur, lien }));
      const enDev = courrielConfigure() ? "" : " (développement : l’e-mail est affiché dans le terminal du serveur)";
      return { error: null, message: `Compte de ${nom} créé (#${cree.id}) : un e-mail l’invite à créer son mot de passe${enDev}.`, lien: null, email };
    } catch (error) {
      console.error("E-mail du nouveau membre non envoyé :", error);
    }
  }
  return { error: null, message: `Compte de ${nom} créé (#${cree.id}), mais l’e-mail n’a pas pu partir : transmettez-lui ce lien pour créer son mot de passe.`, lien, email };
}

export async function modifierParticipant(userId: number, fiche: Fiche): Promise<{ error: string | null }> {
  const admin = await getCurrentUser();
  if (!admin || admin.acces !== "ADMIN") return { error: "Action réservée aux administrateurs." };

  const [firstName, ...reste] = fiche.nom.trim().split(/\s+/);
  const lastName = reste.join(" ");
  if (!firstName || !lastName) return { error: "Indiquez le prénom et le nom." };
  const email = fiche.email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) return { error: "Adresse e-mail invalide." };
  if (estAdresseSuperAdmin(email)) return { error: "Cette adresse est réservée au super admin." };

  // Changer l'adresse d'un administrateur permettrait de prendre son compte (« Mot de passe oublié ») : seuls les membres se modifient ici.
  const cible = await prisma.user.findUnique({ where: { id: userId }, select: { acces: true } });
  if (!cible) return { error: "Ce participant n’existe plus." };
  if (cible.acces === "ADMIN") return { error: "Ce compte est administrateur : il se modifie depuis « Mon compte »." };

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
    await supprimerCompte(userId);
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
