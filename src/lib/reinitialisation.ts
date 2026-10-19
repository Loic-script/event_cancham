import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

/** Un lien « mot de passe oublié » reste valable 1 heure et ne sert qu'une fois. */
export const DUREE_LIEN_MINUTES = 60;
/** Délai minimal entre deux e-mails pour un même compte. */
const INTERVALLE_MS = 60_000;

export const empreinteJeton = (jeton: string) => createHash("sha256").update(jeton).digest("hex");

/** Crée un lien pour le compte (et efface les précédents), ou renvoie null si un e-mail vient déjà de partir. */
export async function creerJeton(userId: number): Promise<string | null> {
  const recent = await prisma.reinitialisationMotDePasse.findFirst({
    where: { userId, utiliseLe: null, createdAt: { gt: new Date(Date.now() - INTERVALLE_MS) } },
    select: { id: true },
  });
  if (recent) return null;
  const jeton = randomBytes(32).toString("base64url");
  await prisma.$transaction([
    prisma.reinitialisationMotDePasse.deleteMany({ where: { userId, utiliseLe: null } }),
    prisma.reinitialisationMotDePasse.create({ data: { userId, tokenHash: empreinteJeton(jeton), expiresAt: new Date(Date.now() + DUREE_LIEN_MINUTES * 60_000) } }),
  ]);
  return jeton;
}

/** Compte du lien s'il est encore valable (non utilisé, non expiré). */
export async function lireJeton(jeton: string): Promise<{ userId: number; email: string } | null> {
  if (!/^[\w-]{40,60}$/.test(jeton)) return null;
  const lien = await prisma.reinitialisationMotDePasse.findUnique({
    where: { tokenHash: empreinteJeton(jeton) },
    select: { utiliseLe: true, expiresAt: true, user: { select: { id: true, email: true } } },
  });
  if (!lien || lien.utiliseLe || lien.expiresAt <= new Date()) return null;
  return { userId: lien.user.id, email: lien.user.email };
}

const echapper = (v: string) => v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

export function courrielReinitialisation(email: string, prenom: string, lien: string) {
  const bonjour = prenom ? `Bonjour ${prenom},` : "Bonjour,";
  return {
    a: email,
    sujet: "Choisissez un nouveau mot de passe – La Traversée",
    texte: `${bonjour}\n\nVous avez demandé à changer le mot de passe de votre compte La Traversée (${email}).\nOuvrez ce lien pour en choisir un nouveau (valable ${DUREE_LIEN_MINUTES} minutes, une seule fois) :\n\n${lien}\n\nSi vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail : votre mot de passe reste inchangé.\n\nL’équipe CanCham Madagascar`,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#0f1d2c;max-width:520px">
<p>${echapper(bonjour)}</p>
<p>Vous avez demandé à changer le mot de passe de votre compte La Traversée (${echapper(email)}).</p>
<p style="margin:24px 0"><a href="${echapper(lien)}" style="display:inline-block;padding:12px 22px;border-radius:8px;background:#c94d0c;color:#ffffff;font-weight:bold;text-decoration:none">Choisir un nouveau mot de passe</a></p>
<p style="color:#5b6b7a;font-size:13px">Ce lien est valable ${DUREE_LIEN_MINUTES} minutes et ne sert qu’une fois. Si le bouton ne marche pas, copiez cette adresse dans votre navigateur :<br><span style="word-break:break-all">${echapper(lien)}</span></p>
<p style="color:#5b6b7a;font-size:13px">Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail : votre mot de passe reste inchangé.</p>
<p>L’équipe CanCham Madagascar</p>
</div>`,
  };
}
