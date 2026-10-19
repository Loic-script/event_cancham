import { ciblePublication, effacerFichiersPublication } from "@/lib/fil";
import { prisma } from "@/lib/prisma";

/**
 * Supprime un compte et tout ce qui en dépend : sessions, publications, j'aime, commentaires et inscriptions partent en cascade ;
 * les j'aime et commentaires des autres sur ses publications (liés par la cible « pub:<id> »), et les fichiers des publications, sont effacés ici.
 */
export async function supprimerCompte(userId: number): Promise<void> {
  const publications = await prisma.publication.findMany({ where: { auteurId: userId }, select: { id: true, image: true, video: true } });
  const cibles = publications.map((p) => ciblePublication(p.id));
  await prisma.$transaction([
    prisma.jaimeFil.deleteMany({ where: { cible: { in: cibles } } }),
    prisma.commentaireFil.deleteMany({ where: { cible: { in: cibles } } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
  await Promise.all(publications.map((p) => effacerFichiersPublication(p.image, p.video)));
}
