"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import {
  MAX_TEXTE_COMMENTAIRE,
  MAX_TEXTE_PUBLICATION,
  URL_IMAGE_FIL,
  URL_VIDEO,
  cibleExiste,
  ciblePublication,
  effacerFichiersPublication,
  selectionCommentaire,
  vueCommentaire,
  type CommentaireVue,
} from "@/lib/fil";
import { prisma } from "@/lib/prisma";
import { aAccesEspace, getCurrentUser } from "@/lib/session";

type Resultat = { error: string | null };

const SANS_ACCES = "Votre session a expiré ou votre accès n’est pas encore validé.";
const INTROUVABLE = "Cette publication n’existe plus.";

async function membre() {
  const user = await getCurrentUser();
  return user && aAccesEspace(user) ? user : null;
}

function rafraichir() {
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function publier(entree: { texte?: unknown; image?: unknown; video?: unknown; equipe?: unknown }): Promise<Resultat> {
  const user = await membre();
  if (!user) return { error: SANS_ACCES };

  const texte = typeof entree.texte === "string" ? entree.texte.trim() : "";
  const image = typeof entree.image === "string" && URL_IMAGE_FIL.test(entree.image) ? entree.image : null;
  const video = typeof entree.video === "string" && URL_VIDEO.test(entree.video) ? entree.video : null;
  const equipe = entree.equipe === true;

  if (equipe && user.acces !== "ADMIN") return { error: "Seule l’équipe peut publier au nom de la CanCham." };
  if (!texte && !image && !video) return { error: "Écrivez un texte ou ajoutez une photo ou une vidéo." };
  if (texte.length > MAX_TEXTE_PUBLICATION) return { error: `La publication ne doit pas dépasser ${MAX_TEXTE_PUBLICATION} caractères.` };

  await prisma.publication.create({ data: { auteurId: user.id, equipe, texte, image, video } });
  rafraichir();
  return { error: null };
}

/** L'auteur ou un administrateur supprime la publication, ses j'aime, ses commentaires et ses fichiers. */
export async function supprimerPublication(id: unknown): Promise<Resultat> {
  const user = await membre();
  if (!user) return { error: SANS_ACCES };
  if (typeof id !== "string") return { error: INTROUVABLE };

  const publication = await prisma.publication.findUnique({ where: { id }, select: { auteurId: true, image: true, video: true } });
  if (!publication) return { error: INTROUVABLE };
  if (publication.auteurId !== user.id && user.acces !== "ADMIN") return { error: "Vous ne pouvez supprimer que vos publications." };

  const cible = ciblePublication(id);
  await prisma.$transaction([
    prisma.jaimeFil.deleteMany({ where: { cible } }),
    prisma.commentaireFil.deleteMany({ where: { cible } }),
    prisma.publication.delete({ where: { id } }),
  ]);
  await effacerFichiersPublication(publication.image, publication.video);
  rafraichir();
  return { error: null };
}

export async function basculerJaime(cible: unknown): Promise<Resultat & { aime?: boolean; jaimes?: number }> {
  const user = await membre();
  if (!user) return { error: SANS_ACCES };
  if (typeof cible !== "string" || !(await cibleExiste(cible))) return { error: INTROUVABLE };

  const { count } = await prisma.jaimeFil.deleteMany({ where: { cible, userId: user.id } });
  let aime = false;
  if (!count) {
    try {
      await prisma.jaimeFil.create({ data: { cible, userId: user.id } });
    } catch (e) {
      // Double clic : le j'aime existe déjà.
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
    }
    aime = true;
  }
  const jaimes = await prisma.jaimeFil.count({ where: { cible } });
  return { error: null, aime, jaimes };
}

export async function lireCommentaires(cible: unknown): Promise<Resultat & { commentaires?: CommentaireVue[] }> {
  const user = await membre();
  if (!user) return { error: SANS_ACCES };
  if (typeof cible !== "string" || !(await cibleExiste(cible))) return { error: INTROUVABLE };

  const commentaires = await prisma.commentaireFil.findMany({ where: { cible }, orderBy: { creeLe: "asc" }, take: 300, select: selectionCommentaire });
  return { error: null, commentaires: commentaires.map((c) => vueCommentaire(c, user.id)) };
}

export async function commenter(cible: unknown, texte: unknown): Promise<Resultat & { commentaire?: CommentaireVue; total?: number }> {
  const user = await membre();
  if (!user) return { error: SANS_ACCES };
  const propre = typeof texte === "string" ? texte.trim() : "";
  if (!propre) return { error: "Écrivez votre commentaire." };
  if (propre.length > MAX_TEXTE_COMMENTAIRE) return { error: `Le commentaire ne doit pas dépasser ${MAX_TEXTE_COMMENTAIRE} caractères.` };
  if (typeof cible !== "string" || !(await cibleExiste(cible))) return { error: INTROUVABLE };

  const cree = await prisma.commentaireFil.create({ data: { cible, auteurId: user.id, texte: propre }, select: selectionCommentaire });
  const total = await prisma.commentaireFil.count({ where: { cible } });
  return { error: null, commentaire: vueCommentaire(cree, user.id), total };
}

/** L'auteur du commentaire ou un administrateur. */
export async function supprimerCommentaire(id: unknown): Promise<Resultat & { total?: number }> {
  const user = await membre();
  if (!user) return { error: SANS_ACCES };
  if (typeof id !== "string") return { error: "Ce commentaire n’existe plus." };

  const commentaire = await prisma.commentaireFil.findUnique({ where: { id }, select: { auteurId: true, cible: true } });
  if (!commentaire) return { error: "Ce commentaire n’existe plus." };
  if (commentaire.auteurId !== user.id && user.acces !== "ADMIN") return { error: "Vous ne pouvez supprimer que vos commentaires." };

  await prisma.commentaireFil.delete({ where: { id } });
  const total = await prisma.commentaireFil.count({ where: { cible: commentaire.cible } });
  return { error: null, total };
}
