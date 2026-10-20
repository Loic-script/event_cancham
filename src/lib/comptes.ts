import { ciblePublication, effacerFichiersPublication } from "@/lib/fil";
import { effacerFichierPhoto } from "@/lib/galerie";
import { supprimerConversationsDe } from "@/lib/messagerie";
import { effacerPhotoProfil } from "@/lib/photo-profil";
import { prisma } from "@/lib/prisma";

/**
 * Supprime un compte et tout ce qui en dépend : sessions, publications, j'aime, commentaires et inscriptions partent en cascade ;
 * les j'aime et commentaires des autres sur ses publications (liés par la cible « pub:<id> »), les fichiers des publications et la photo de profil sont effacés ici.
 */
export async function supprimerCompte(userId: number): Promise<void> {
  // Avant le compte : ses conversations et leurs messages vocaux (les fichiers ne partent pas en cascade).
  await supprimerConversationsDe(userId);
  const compte = await prisma.user.findUnique({ where: { id: userId }, select: { photo: true, couverture: true } });
  const publications = await prisma.publication.findMany({ where: { auteurId: userId }, select: { id: true, image: true, video: true } });
  // Les photos partagées dans la galerie partent avec le compte ; celles de l'équipe restent (officielles).
  const photos = await prisma.photoGalerie.findMany({ where: { auteurId: userId, officielle: false }, select: { id: true } });
  const souvenirs = await prisma.souvenirLivre.findMany({ where: { auteurId: userId }, select: { video: true } });
  const cibles = publications.map((p) => ciblePublication(p.id));
  await prisma.$transaction([
    prisma.jaimeFil.deleteMany({ where: { cible: { in: cibles } } }),
    prisma.commentaireFil.deleteMany({ where: { cible: { in: cibles } } }),
    prisma.photoGalerie.deleteMany({ where: { id: { in: photos.map((p) => p.id) } } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
  await Promise.all([...publications.map((p) => effacerFichiersPublication(p.image, p.video)), ...photos.map((p) => effacerFichierPhoto(p.id)), ...souvenirs.map((l) => effacerFichiersPublication(null, l.video)), effacerPhotoProfil(compte?.photo), effacerPhotoProfil(compte?.couverture)]);
}
