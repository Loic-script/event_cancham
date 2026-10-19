"use server";

import { redirect } from "next/navigation";
import { EMAIL_PATTERN, MIN_PASSWORD_LENGTH } from "@/lib/coordonnees";
import { courrielDisponible, envoyerCourriel } from "@/lib/courriel";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { courrielReinitialisation, creerJeton, empreinteJeton } from "@/lib/reinitialisation";
import { createSession } from "@/lib/session";
import { urlPublique } from "@/lib/url";

export type DemandeState = { error: string | null; envoyeA: string | null };
export type NouveauMotDePasseState = { error: string | null };

/** Même réponse que l'adresse ait un compte ou non : la page ne révèle pas qui est inscrit. */
export async function demanderLien(_previous: DemandeState, formData: FormData): Promise<DemandeState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) return { error: "L’adresse e-mail n’est pas valide.", envoyeA: null };
  if (!courrielDisponible() || (process.env.NODE_ENV === "production" && !process.env.APP_URL)) {
    console.error("Mot de passe oublié : configurez SMTP_HOST (et SMTP_USER, SMTP_PASS, MAIL_FROM) ainsi que APP_URL.");
    return { error: "L’envoi d’e-mails n’est pas encore activé sur la plateforme. Contactez l’équipe CanCham pour changer votre mot de passe.", envoyeA: null };
  }

  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, firstName: true } });
    const jeton = user ? await creerJeton(user.id) : null;
    if (user && jeton) {
      const lien = `${await urlPublique({ fiable: true })}/mot-de-passe-oublie/${jeton}`;
      await envoyerCourriel(courrielReinitialisation(email, user.firstName, lien));
    }
  } catch (error) {
    console.error("Mot de passe oublié : envoi impossible :", error);
    return { error: "L’e-mail n’a pas pu être envoyé. Réessayez dans un instant.", envoyeA: null };
  }
  return { error: null, envoyeA: email };
}

/** Enregistre le nouveau mot de passe, ferme toutes les sessions du compte, puis connecte ce navigateur. */
export async function choisirMotDePasse(_previous: NouveauMotDePasseState, formData: FormData): Promise<NouveauMotDePasseState> {
  const jeton = String(formData.get("jeton") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (password.length < MIN_PASSWORD_LENGTH) return { error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.` };
  if (password !== confirmation) return { error: "Les deux mots de passe ne sont pas identiques." };

  const passwordHash = await hashPassword(password);
  let user: { id: number; acces: string } | null;
  try {
    user = await prisma.$transaction(async (tx) => {
      const lien = await tx.reinitialisationMotDePasse.findUnique({ where: { tokenHash: empreinteJeton(jeton) }, select: { id: true, userId: true } });
      if (!lien) return null;
      // Une seule utilisation, même si le formulaire part deux fois.
      const { count } = await tx.reinitialisationMotDePasse.updateMany({ where: { id: lien.id, utiliseLe: null, expiresAt: { gt: new Date() } }, data: { utiliseLe: new Date() } });
      if (!count) return null;
      await tx.reinitialisationMotDePasse.deleteMany({ where: { userId: lien.userId, utiliseLe: null } });
      await tx.session.deleteMany({ where: { userId: lien.userId } });
      return tx.user.update({ where: { id: lien.userId }, data: { passwordHash }, select: { id: true, acces: true } });
    });
  } catch (error) {
    console.error("Nouveau mot de passe impossible :", error);
    return { error: "La base de données ne répond pas. Réessayez dans un instant." };
  }
  if (!user) return { error: "Ce lien n’est plus valable. Demandez-en un nouveau." };

  await createSession(user.id);
  redirect(user.acces === "ADMIN" ? "/admin" : "/");
}
