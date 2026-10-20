import { URL_IMAGE_FIL, effacerFichiersPublication } from "@/lib/fil";
import { FORMATS_PHOTO, cheminPhoto, type FormatPhoto } from "@/lib/photos";
import { prisma } from "@/lib/prisma";
import { supprimer } from "@/lib/ressources/stockage";
import { NB_PROMOTIONS, type PhotoVue, type Promo, type StoryVue } from "@/lib/traversee/galerie";

/** Image enregistrée par l'application (photo envoyée) ou photo du site livrée avec l'application. */
export const imageAccueilValide = (url: unknown): url is string => typeof url === "string" && (URL_IMAGE_FIL.test(url) || /^\/traversee\/[a-z0-9-]+\.jpg$/.test(url));

/** Efface le fichier d'une image d'accueil envoyée (les photos du site restent). */
export async function effacerImageAccueil(url: string | null | undefined): Promise<void> {
  if (url && URL_IMAGE_FIL.test(url)) await effacerFichiersPublication(url, null);
}

export async function effacerFichierPhoto(id: string): Promise<void> {
  await Promise.all((Object.keys(FORMATS_PHOTO) as FormatPhoto[]).map((f) => supprimer(cheminPhoto(id, f))));
}

const nom = (u: { firstName: string; lastName: string } | null) => (u ? `${u.firstName} ${u.lastName}`.trim() : "Participant");

export async function photosGalerie(userId: number): Promise<PhotoVue[]> {
  const lignes = await prisma.photoGalerie.findMany({ orderBy: { creeLe: "desc" }, select: { id: true, auteurId: true, officielle: true, creeLe: true, auteur: { select: { firstName: true, lastName: true } } } });
  return lignes.map((p) => ({ id: p.id, src: `/api/photos/${p.id}`, officielle: p.officielle, auteur: p.officielle ? "CanCham" : nom(p.auteur), aMoi: p.auteurId === userId, t: p.creeLe.getTime() }));
}

/** Stories de l'accueil : celles de la CanCham, puis les photos de la galerie, des plus récentes aux plus anciennes. */
export async function storiesAccueil(): Promise<StoryVue[]> {
  const [stories, photos] = await Promise.all([
    prisma.story.findMany({ orderBy: { creeLe: "desc" }, select: { id: true, image: true, texte: true } }),
    prisma.photoGalerie.findMany({ orderBy: { creeLe: "desc" }, take: 60, select: { id: true, officielle: true } }),
  ]);
  return [
    ...stories.map((s): StoryVue => ({ id: s.id, img: s.image, texte: s.texte, auteur: "CanCham", story: s.id })),
    ...photos.map((p): StoryVue => ({ id: `gal-${p.id}`, img: `/api/photos/${p.id}`, texte: p.officielle ? "La Traversée en images" : "Partagée par un participant", auteur: p.officielle ? "CanCham" : "Participant", photo: p.id })),
  ];
}

/** Les emplacements promotion dans l'ordre, null pour un emplacement libre. */
export async function promotions(): Promise<(Promo | null)[]> {
  const lignes = await prisma.promotion.findMany({ where: { emplacement: { lt: NB_PROMOTIONS } } });
  return Array.from({ length: NB_PROMOTIONS }, (_, i) => {
    const p = lignes.find((l) => l.emplacement === i);
    return p ? { ann: p.annonceur, titre: p.titre, texte: p.texte, img: p.image, lien: p.lien } : null;
  });
}

/**
 * Au démarrage : les photos envoyées avant que la galerie ne soit en base (fichiers de stockage/photos sans ligne)
 * y sont inscrites comme photos de l'équipe, la seule à pouvoir en envoyer à l'époque.
 */
export async function reprendrePhotosSansLigne(): Promise<void> {
  const { promises: fs } = await import("node:fs");
  const path = await import("node:path");
  const { racineStockage } = await import("@/lib/ressources/stockage");
  const fichiers = await fs.readdir(path.join(racineStockage(), "photos")).catch(() => [] as string[]);
  const ids = [...new Set(fichiers.map((f) => /^([a-f0-9]{32})\.(jpg|png|webp)$/.exec(f)?.[1]).filter((id): id is string => Boolean(id)))];
  if (!ids.length) return;
  const connues = new Set((await prisma.photoGalerie.findMany({ where: { id: { in: ids } }, select: { id: true } })).map((p) => p.id));
  const nouvelles = ids.filter((id) => !connues.has(id));
  if (!nouvelles.length) return;
  await prisma.photoGalerie.createMany({ data: nouvelles.map((id) => ({ id, officielle: true })), skipDuplicates: true });
  console.log(`Galerie : ${nouvelles.length} photo(s) déjà envoyée(s) inscrite(s) en base.`);
}
