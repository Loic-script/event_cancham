"use server";

import { revalidatePath } from "next/cache";
import { URL_IMAGE_FIL, cheminImageFil } from "@/lib/fil";
import { FORMATS_PHOTO, type FormatPhoto } from "@/lib/photos";
import { prisma } from "@/lib/prisma";
import { supprimer } from "@/lib/ressources/stockage";
import { aAccesEspace, getCurrentUser } from "@/lib/session";
import { DESTINATIONS, TYPES_ANNONCE } from "@/lib/traversee/data";

type Resultat = { error: string | null };

async function admin() {
  const user = await getCurrentUser();
  return user && user.acces === "ADMIN" ? user : null;
}

function rafraichir() {
  revalidatePath("/", "layout");
}

/** Publie une annonce pour tous les participants (fenêtre à leur prochaine page, puis dans la cloche). */
export async function publierAnnonce(d: { titre?: unknown; message?: unknown; type?: unknown; cta?: unknown; image?: unknown }): Promise<Resultat> {
  const user = await admin();
  if (!user) return { error: "Action réservée aux administrateurs." };
  const titre = typeof d.titre === "string" ? d.titre.trim() : "";
  const message = typeof d.message === "string" ? d.message.trim() : "";
  const type = typeof d.type === "string" && d.type in TYPES_ANNONCE ? d.type : "info";
  const cta = typeof d.cta === "string" && DESTINATIONS.some((x) => x.href === d.cta) ? d.cta : "";
  const image = typeof d.image === "string" && URL_IMAGE_FIL.test(d.image) ? d.image : null;
  if (!titre || !message) return { error: "Renseignez un titre et un message." };
  if (titre.length > 120 || message.length > 1200) return { error: "Le titre ou le message est trop long." };

  await prisma.annonce.create({ data: { titre, message, type, cta, image, auteurId: user.id } });
  rafraichir();
  return { error: null };
}

/** Supprime une annonce ; sa photo n'est effacée que si aucune autre annonce ne l'utilise (« Renvoyer » la réutilise). */
export async function supprimerAnnonce(id: unknown): Promise<Resultat> {
  if (!(await admin())) return { error: "Action réservée aux administrateurs." };
  if (typeof id !== "string") return { error: "Cette annonce n’existe plus." };
  const annonce = await prisma.annonce.findUnique({ where: { id }, select: { image: true } });
  if (!annonce) return { error: "Cette annonce n’existe plus." };
  await prisma.annonce.delete({ where: { id } });
  const idImage = annonce.image?.match(URL_IMAGE_FIL)?.[1];
  if (idImage && !(await prisma.annonce.count({ where: { image: annonce.image } }))) {
    await Promise.all((Object.keys(FORMATS_PHOTO) as FormatPhoto[]).map((f) => supprimer(cheminImageFil(idImage, f)))).catch(() => undefined);
  }
  rafraichir();
  return { error: null };
}

/** Le participant a vu ces annonces : la fenêtre ne s'ouvrira plus. */
export async function marquerAnnoncesVues(ids: unknown): Promise<Resultat> {
  const user = await getCurrentUser();
  if (!user || !aAccesEspace(user)) return { error: "Session expirée." };
  const liste = Array.isArray(ids) ? ids.filter((x): x is string => typeof x === "string").slice(0, 50) : [];
  if (!liste.length) return { error: null };
  const existantes = await prisma.annonce.findMany({ where: { id: { in: liste } }, select: { id: true } });
  await prisma.annonceVue.createMany({ data: existantes.map((a) => ({ annonceId: a.id, userId: user.id })), skipDuplicates: true });
  return { error: null };
}
