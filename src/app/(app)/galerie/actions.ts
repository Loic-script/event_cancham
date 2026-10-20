"use server";

import { revalidatePath } from "next/cache";
import { effacerFichierPhoto, effacerImageAccueil, imageAccueilValide } from "@/lib/galerie";
import { idPhotoValide } from "@/lib/photos";
import { prisma } from "@/lib/prisma";
import { aAccesEspace, getCurrentUser } from "@/lib/session";
import { DESTINATIONS } from "@/lib/traversee/data";
import { NB_PROMOTIONS } from "@/lib/traversee/galerie";

type Resultat = { error: string | null };

const RESERVE = "Action réservée aux administrateurs.";

async function admin() {
  const user = await getCurrentUser();
  return user && user.acces === "ADMIN" ? user : null;
}

function rafraichir() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/photos");
  revalidatePath("/photos");
}

/** Story de la CanCham : la photo est d'abord envoyée sur /api/fil/images. */
export async function publierStory(image: unknown, texte: unknown = ""): Promise<Resultat> {
  const user = await admin();
  if (!user) return { error: RESERVE };
  if (typeof image !== "string" || !imageAccueilValide(image)) return { error: "Choisissez la photo de la story." };
  await prisma.story.create({ data: { image, texte: typeof texte === "string" ? texte.trim().slice(0, 300) : "", auteurId: user.id } });
  rafraichir();
  return { error: null };
}

export async function supprimerStory(id: unknown): Promise<Resultat> {
  if (!(await admin())) return { error: RESERVE };
  if (typeof id !== "string") return { error: "Cette story n’existe plus." };
  const story = await prisma.story.findUnique({ where: { id }, select: { image: true } });
  if (!story) return { error: "Cette story n’existe plus." };
  await prisma.story.delete({ where: { id } });
  await effacerImageAccueil(story.image);
  rafraichir();
  return { error: null };
}

/** Retire une photo de la galerie (et donc des stories) : l'équipe, ou le participant qui l'a partagée. */
export async function supprimerPhotoGalerie(id: unknown): Promise<Resultat> {
  const user = await getCurrentUser();
  if (!user || !aAccesEspace(user)) return { error: "Votre session a expiré ou votre accès n’est pas encore validé." };
  if (!idPhotoValide(id)) return { error: "Cette photo n’existe plus." };
  const photo = await prisma.photoGalerie.findUnique({ where: { id }, select: { auteurId: true } });
  if (!photo) return { error: "Cette photo n’existe plus." };
  if (user.acces !== "ADMIN" && photo.auteurId !== user.id) return { error: "Vous ne pouvez retirer que vos propres photos." };
  await prisma.photoGalerie.delete({ where: { id } });
  await effacerFichierPhoto(id);
  rafraichir();
  return { error: null };
}

export type PromoSaisie = { ann: string; titre: string; texte: string; img: string; lien: string };

export async function enregistrerPromotion(emplacement: unknown, p: PromoSaisie): Promise<Resultat> {
  if (!(await admin())) return { error: RESERVE };
  if (!Number.isInteger(emplacement) || (emplacement as number) < 0 || (emplacement as number) >= NB_PROMOTIONS) return { error: "Emplacement inconnu." };
  const ann = String(p?.ann ?? "").trim();
  const titre = String(p?.titre ?? "").trim();
  const texte = String(p?.texte ?? "").trim();
  if (!ann || ann.length > 80) return { error: "Indiquez l’annonceur (80 caractères au plus)." };
  if (!titre || titre.length > 60) return { error: "Indiquez un titre (60 caractères au plus)." };
  if (texte.length > 90) return { error: "Le texte fait 90 caractères au plus." };
  if (!imageAccueilValide(p?.img)) return { error: "Ajoutez la photo de la promotion." };
  if (!DESTINATIONS.some((d) => d.href === p?.lien)) return { error: "Choisissez la page vers laquelle mène la promotion." };
  const n = emplacement as number;
  const avant = await prisma.promotion.findUnique({ where: { emplacement: n }, select: { image: true } });
  const donnees = { annonceur: ann, titre, texte, image: p.img, lien: p.lien };
  await prisma.promotion.upsert({ where: { emplacement: n }, create: { emplacement: n, ...donnees }, update: donnees });
  if (avant && avant.image !== p.img) await effacerImageAccueil(avant.image);
  rafraichir();
  return { error: null };
}

export async function viderPromotion(emplacement: unknown): Promise<Resultat> {
  if (!(await admin())) return { error: RESERVE };
  if (!Number.isInteger(emplacement)) return { error: "Emplacement inconnu." };
  const avant = await prisma.promotion.findUnique({ where: { emplacement: emplacement as number }, select: { image: true } });
  if (avant) {
    await prisma.promotion.delete({ where: { emplacement: emplacement as number } });
    await effacerImageAccueil(avant.image);
  }
  rafraichir();
  return { error: null };
}
