"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { aAccesEspace, getCurrentUser } from "@/lib/session";
import { parseSocialLink } from "@/lib/social/links";
import { NOTE_MAX } from "@/lib/traversee/pitchs";

type Resultat = { error: string | null };

const SANS_ACCES = "Votre session a expiré ou votre accès n’est pas encore validé.";

async function membre() {
  const user = await getCurrentUser();
  return user && aAccesEspace(user) ? user : null;
}

async function admin() {
  const user = await getCurrentUser();
  return user && user.acces === "ADMIN" ? user : null;
}

function rafraichir() {
  revalidatePath("/defis", "layout");
  revalidatePath("/admin/defis", "layout");
}

/** Défi 1 : lien de la vidéo pitch (Drive, YouTube, Vimeo…). Un nouvel envoi remplace le précédent et efface la note. */
export async function envoyerPitch(lien: unknown): Promise<Resultat> {
  const user = await membre();
  if (!user) return { error: SANS_ACCES };
  const url = typeof lien === "string" ? lien.trim() : "";
  if (!/^https?:\/\/[^\s/]+\.[^\s]+$/i.test(url) || url.length > 500) return { error: "Collez un lien valide vers votre vidéo, qui commence par https://." };
  await prisma.participationDefi.upsert({
    where: { defi_userId: { defi: "pitch", userId: user.id } },
    create: { defi: "pitch", userId: user.id, lien: url },
    update: { lien: url, note: null, avis: "", noteLe: null, creeLe: new Date() },
  });
  rafraichir();
  return { error: null };
}

/** Défi 2 : lien de la publication « J'y serai » (Facebook, Instagram ou LinkedIn). */
export async function enregistrerPublication(lien: unknown): Promise<Resultat> {
  const user = await membre();
  if (!user) return { error: SANS_ACCES };
  const parsed = parseSocialLink(typeof lien === "string" ? lien.trim() : "");
  if (!parsed.ok) return { error: "Collez le lien complet de votre publication Facebook, Instagram ou LinkedIn." };
  await prisma.participationDefi.upsert({
    where: { defi_userId: { defi: "tombola", userId: user.id } },
    create: { defi: "tombola", userId: user.id, lien: parsed.url },
    update: { lien: parsed.url, reactions: null, commentaires: null, partages: null, releveLe: null, creeLe: new Date() },
  });
  rafraichir();
  return { error: null };
}

/** Jury : note sur 20 (au demi-point) et appréciation d'une candidature pitch. */
export async function noterPitch(id: unknown, note: unknown, avis: unknown): Promise<Resultat> {
  if (!(await admin())) return { error: "Action réservée aux administrateurs." };
  const n = Number(note);
  if (typeof id !== "string" || !Number.isFinite(n) || n < 0 || n > NOTE_MAX || Math.round(n * 2) !== n * 2) return { error: `Donnez une note entre 0 et ${NOTE_MAX}.` };
  const texte = typeof avis === "string" ? avis.trim().slice(0, 1000) : "";
  const { count } = await prisma.participationDefi.updateMany({ where: { id, defi: "pitch" }, data: { note: n, avis: texte, noteLe: new Date() } });
  if (!count) return { error: "Cette candidature n’existe plus." };
  rafraichir();
  return { error: null };
}

export async function effacerNotePitch(id: unknown): Promise<Resultat> {
  if (!(await admin())) return { error: "Action réservée aux administrateurs." };
  if (typeof id !== "string") return { error: "Cette candidature n’existe plus." };
  await prisma.participationDefi.updateMany({ where: { id, defi: "pitch" }, data: { note: null, avis: "", noteLe: null } });
  rafraichir();
  return { error: null };
}

/** Équipe : retire une publication du classement (ou la rétablit). */
export async function retirerDuClassement(id: unknown, retire: unknown): Promise<Resultat> {
  if (!(await admin())) return { error: "Action réservée aux administrateurs." };
  if (typeof id !== "string") return { error: "Cette publication n’existe plus." };
  const { count } = await prisma.participationDefi.updateMany({ where: { id, defi: "tombola" }, data: { retire: retire === true } });
  if (!count) return { error: "Cette publication n’existe plus." };
  rafraichir();
  return { error: null };
}
