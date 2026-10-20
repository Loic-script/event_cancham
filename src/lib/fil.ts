import path from "node:path";
import { FORMATS_PHOTO, type FormatPhoto } from "@/lib/photos";
import { prisma } from "@/lib/prisma";
import { racineStockage, supprimer } from "@/lib/ressources/stockage";
import { FORMATS_VIDEO, cheminVideo, type FormatVideo } from "@/lib/videos";
import { ACTUS } from "@/lib/traversee/data";

/** Photos jointes aux publications : réduites à 1080 px dans le navigateur avant l'envoi. */
export const TAILLE_MAX_IMAGE_FIL = 8 * 1024 * 1024;
export const MAX_TEXTE_PUBLICATION = 1200;
export const MAX_TEXTE_COMMENTAIRE = 1000;

const ID_FICHIER = /^[a-f0-9]{32}$/;
export const URL_IMAGE_FIL = /^\/api\/fil\/images\/([a-f0-9]{32})$/;
export const URL_VIDEO = /^\/api\/videos\/([a-f0-9]{32})$/;

export function idFichierValide(id: unknown): id is string {
  return typeof id === "string" && ID_FICHIER.test(id);
}

export function cheminImageFil(id: string, format: FormatPhoto): string {
  if (!idFichierValide(id)) throw new Error("Identifiant d’image invalide");
  return path.join(racineStockage(), "fil", `${id}.${format}`);
}

/** Efface du stockage la photo ou la vidéo d'une publication supprimée. */
export async function effacerFichiersPublication(image: string | null, video: string | null): Promise<void> {
  const idImage = image?.match(URL_IMAGE_FIL)?.[1];
  const idVideo = video?.match(URL_VIDEO)?.[1];
  await Promise.all([
    ...(idImage ? (Object.keys(FORMATS_PHOTO) as FormatPhoto[]).map((f) => supprimer(cheminImageFil(idImage, f))) : []),
    ...(idVideo ? (Object.keys(FORMATS_VIDEO) as FormatVideo[]).map((f) => supprimer(cheminVideo(idVideo, f))) : []),
  ]).catch((e) => console.error("Fichiers d’une publication non effacés :", e));
}

/** Une cible de j'aime ou de commentaire : publication du fil, ou article officiel (ACTUS). */
export const ciblePublication = (id: string) => `pub:${id}`;
export const cibleArticle = (id: string) => `actu:${id}`;

const ARTICLES = new Set(ACTUS.map((a) => a.id));

export async function cibleExiste(cible: string): Promise<boolean> {
  const [type, id] = [cible.slice(0, cible.indexOf(":")), cible.slice(cible.indexOf(":") + 1)];
  if (type === "actu") return ARTICLES.has(id);
  if (type === "pub" && id) return !!(await prisma.publication.findUnique({ where: { id }, select: { id: true } }));
  return false;
}

const FUSEAU = "Indian/Antananarivo";
const JOUR = new Intl.DateTimeFormat("fr-CA", { timeZone: FUSEAU });
const HEURE = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: FUSEAU });
const DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: FUSEAU });

/** « Aujourd’hui à 17 h 42 », « Hier à 9 h 05 » ou « 18 octobre à 9 h 05 », à l'heure de Madagascar. */
export function quand(d: Date): string {
  const heure = HEURE.format(d).replace(":", " h ");
  const jour = JOUR.format(d);
  if (jour === JOUR.format(new Date())) return `Aujourd’hui à ${heure}`;
  if (jour === JOUR.format(new Date(Date.now() - 86_400_000))) return `Hier à ${heure}`;
  return `${DATE.format(d)} à ${heure}`;
}

export type AuteurFil = { id: number; nom: string; detail: string; photo: string | null };

export type PublicationFil = {
  id: string;
  cible: string;
  equipe: boolean;
  texte: string;
  image: string | null;
  video: string | null;
  quand: string;
  auteur: AuteurFil;
  aMoi: boolean;
};

export type CompteurFil = { jaimes: number; commentaires: number; aime: boolean };
export type DonneesFil = { publications: PublicationFil[]; compteurs: Record<string, CompteurFil> };

export type CommentaireVue = { id: string; texte: string; quand: string; auteur: { id: number; nom: string; photo: string | null }; aMoi: boolean };

const nom = (u: { firstName: string; lastName: string }) => `${u.firstName} ${u.lastName}`.trim();

export async function chargerFil(userId: number): Promise<DonneesFil> {
  const publications = await prisma.publication.findMany({
    orderBy: { creeLe: "desc" },
    take: 100,
    select: {
      id: true,
      equipe: true,
      texte: true,
      image: true,
      video: true,
      creeLe: true,
      auteur: { select: { id: true, firstName: true, lastName: true, role: true, company: true, photo: true } },
    },
  });

  const cibles = [...publications.map((p) => ciblePublication(p.id)), ...ACTUS.map((a) => cibleArticle(a.id))];
  const [jaimes, commentaires, miens] = await Promise.all([
    prisma.jaimeFil.groupBy({ by: ["cible"], where: { cible: { in: cibles } }, _count: { _all: true } }),
    prisma.commentaireFil.groupBy({ by: ["cible"], where: { cible: { in: cibles } }, _count: { _all: true } }),
    prisma.jaimeFil.findMany({ where: { userId, cible: { in: cibles } }, select: { cible: true } }),
  ]);

  const compteurs: Record<string, CompteurFil> = Object.fromEntries(cibles.map((c) => [c, { jaimes: 0, commentaires: 0, aime: false }]));
  for (const j of jaimes) compteurs[j.cible].jaimes = j._count._all;
  for (const c of commentaires) compteurs[c.cible].commentaires = c._count._all;
  for (const m of miens) compteurs[m.cible].aime = true;

  return {
    compteurs,
    publications: publications.map((p) => ({
      id: p.id,
      cible: ciblePublication(p.id),
      equipe: p.equipe,
      texte: p.texte,
      image: p.image,
      video: p.video,
      quand: quand(p.creeLe),
      auteur: { id: p.auteur.id, nom: nom(p.auteur), detail: [p.auteur.role, p.auteur.company].filter(Boolean).join(" · "), photo: p.auteur.photo },
      aMoi: p.auteur.id === userId,
    })),
  };
}

export function vueCommentaire(
  c: { id: string; texte: string; creeLe: Date; auteur: { id: number; firstName: string; lastName: string; photo: string | null } },
  userId: number,
): CommentaireVue {
  return { id: c.id, texte: c.texte, quand: quand(c.creeLe), auteur: { id: c.auteur.id, nom: nom(c.auteur), photo: c.auteur.photo }, aMoi: c.auteur.id === userId };
}

export const selectionCommentaire = {
  id: true,
  texte: true,
  creeLe: true,
  auteur: { select: { id: true, firstName: true, lastName: true, photo: true } },
} as const;
