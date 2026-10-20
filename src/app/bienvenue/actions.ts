"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LOGIN_PATH, safeNext } from "@/lib/auth";
import { estEtape, PAGE_PARCOURS } from "@/lib/parcours";
import { prisma } from "@/lib/prisma";
import { aAccesEspace, getCurrentUser, PAGE_ATTENTE } from "@/lib/session";

type Resultat = { error: string | null };

const SESSION_EXPIREE = "Votre session a expiré : reconnectez-vous.";

/** Le parcours concerne les participants (pas les administrateurs) dont l'inscription n'a pas été refusée. */
async function participant() {
  const user = await getCurrentUser();
  return user && user.acces !== "ADMIN" && user.statut !== "REFUSE" ? user : null;
}

/** Le participant a dépassé l'écran d'introduction : le parcours reprendra directement à la première étape restante. */
export async function commencerParcours(): Promise<Resultat> {
  const user = await participant();
  if (!user) return { error: SESSION_EXPIREE };
  await prisma.parcoursAccueil.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });
  return { error: null };
}

export async function passerEtape(id: unknown): Promise<Resultat> {
  const user = await participant();
  if (!user) return { error: SESSION_EXPIREE };
  if (!estEtape(id)) return { error: "Cette étape n’existe pas." };
  const p = await prisma.parcoursAccueil.findUnique({ where: { userId: user.id }, select: { passees: true } });
  const passees = [...new Set([...(p?.passees ?? []), id])];
  await prisma.parcoursAccueil.upsert({ where: { userId: user.id }, create: { userId: user.id, passees }, update: { passees } });
  return { error: null };
}

export type EntrepriseSaisie = { company: string; role: string; sector: string; bio: string };

/** Étape « Votre entreprise » : enregistrée sur le compte, comme depuis la page Profil. */
export async function enregistrerEntreprise(saisie: EntrepriseSaisie): Promise<Resultat> {
  const user = await participant();
  if (!user) return { error: SESSION_EXPIREE };
  const champ = (v: unknown) => String(v ?? "").trim();
  const company = champ(saisie?.company);
  const role = champ(saisie?.role);
  const sector = champ(saisie?.sector);
  const bio = champ(saisie?.bio);
  if (!company) return { error: "Indiquez le nom de votre entreprise." };
  if (company.length > 80) return { error: "Le nom de l’entreprise fait 80 caractères au plus." };
  if (!role) return { error: "Indiquez votre fonction dans l’entreprise." };
  if (role.length > 80) return { error: "La fonction fait 80 caractères au plus." };
  if (!sector) return { error: "Choisissez votre secteur d’activité." };
  if (sector.length > 40) return { error: "Le secteur fait 40 caractères au plus." };
  if (bio.length > 600) return { error: "Votre présentation fait 600 caractères au plus." };
  await prisma.user.update({ where: { id: user.id }, data: { company, role, sector, bio: bio || null } });
  revalidatePath("/annuaire");
  revalidatePath("/admin/participants");
  revalidatePath("/profil");
  return { error: null };
}

/** Dernier écran : le parcours est terminé, il ne s'ouvrira plus à la connexion. */
export async function terminerParcours(formData: FormData): Promise<void> {
  const user = await participant();
  if (!user) redirect(LOGIN_PATH);
  const termineLe = new Date();
  await prisma.parcoursAccueil.upsert({ where: { userId: user.id }, create: { userId: user.id, termineLe }, update: { termineLe } });
  revalidatePath("/profil");
  redirect(aAccesEspace(user) ? safeNext(formData.get("next")) : PAGE_ATTENTE);
}

/** Bandeau « Reprendre » du profil : les étapes passées sont proposées de nouveau. */
export async function reprendreParcours(): Promise<void> {
  const user = await participant();
  if (!user) redirect(LOGIN_PATH);
  await prisma.parcoursAccueil.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: { passees: [], termineLe: null } });
  redirect(PAGE_PARCOURS);
}
