import { prisma } from "@/lib/prisma";
import type { TypeNotif } from "@/lib/traversee/store";

/** Notification tirée de la base : ce qui s'est passé sur la plateforme, visible depuis n'importe quel appareil. */
export type Activite = { id: string; type: TypeNotif; titre: string; texte: string; href: string; t: number; acteur?: string };

const JOURS = 7;
const depuis = () => new Date(Date.now() - JOURS * 86_400_000);
const auteur = { select: { firstName: true, lastName: true } } as const;
const nom = (u: { firstName: string; lastName: string }) => `${u.firstName} ${u.lastName}`.trim();
const extrait = (t: string) => (t.length > 120 ? `${t.slice(0, 117)}…` : t);

/** Pour l'équipe : publications des participants, défis, livre d'or et photos partagées (7 derniers jours). */
export async function activiteAdmin(): Promise<Activite[]> {
  const d = depuis();
  const [pubs, defis, souvenirs, photos] = await Promise.all([
    prisma.publication.findMany({ where: { equipe: false, creeLe: { gt: d } }, orderBy: { creeLe: "desc" }, take: 20, select: { id: true, texte: true, video: true, creeLe: true, auteur } }),
    prisma.participationDefi.findMany({ where: { creeLe: { gt: d } }, orderBy: { creeLe: "desc" }, take: 30, select: { id: true, defi: true, creeLe: true, user: auteur } }),
    prisma.souvenirLivre.findMany({ where: { statut: "ATTENTE" }, orderBy: { creeLe: "desc" }, take: 20, select: { id: true, creeLe: true, auteur } }),
    prisma.photoGalerie.findMany({ where: { officielle: false, creeLe: { gt: d } }, orderBy: { creeLe: "desc" }, take: 20, select: { id: true, creeLe: true, auteur } }),
  ]);
  return [
    ...pubs.map((p): Activite => ({ id: `pub-${p.id}`, type: "publication", titre: `${nom(p.auteur)} a publié dans le fil`, texte: p.texte ? extrait(p.texte) : p.video ? "Nouvelle vidéo partagée." : "Nouvelle photo partagée.", href: "/admin", t: p.creeLe.getTime(), acteur: nom(p.auteur) })),
    ...defis.map((p): Activite =>
      p.defi === "pitch"
        ? { id: `defi-${p.id}-${p.creeLe.getTime()}`, type: "defi1", titre: `${nom(p.user)} a envoyé sa vidéo pitch`, texte: "Gagnez un voyage au Canada · à noter par le jury.", href: "/admin/defis/pitch", t: p.creeLe.getTime(), acteur: nom(p.user) }
        : { id: `defi-${p.id}-${p.creeLe.getTime()}`, type: "defi2", titre: `${nom(p.user)} participe au Défi 2`, texte: "Publication « J’y serai » enregistrée · Gagnez 3 000 000 Ar.", href: "/admin/defis/tombola", t: p.creeLe.getTime(), acteur: nom(p.user) },
    ),
    ...souvenirs.map((l): Activite => ({ id: `livre-${l.id}`, type: "livre", titre: `${nom(l.auteur)} a déposé une vidéo au livre d’or`, texte: "Souvenir en attente de validation.", href: "/admin/livre", t: l.creeLe.getTime(), acteur: nom(l.auteur) })),
    ...photos.map((p): Activite => ({ id: `photo-${p.id}`, type: "story", titre: `${p.auteur ? nom(p.auteur) : "Un participant"} a partagé une photo`, texte: "Visible dans la galerie et les stories.", href: "/admin/photos", t: p.creeLe.getTime(), acteur: p.auteur ? nom(p.auteur) : undefined })),
  ];
}

/** Pour les participants : actualités et stories publiées par la CanCham (7 derniers jours). */
export async function activiteParticipant(): Promise<Activite[]> {
  const d = depuis();
  const [pubs, stories] = await Promise.all([
    prisma.publication.findMany({ where: { equipe: true, creeLe: { gt: d } }, orderBy: { creeLe: "desc" }, take: 10, select: { id: true, texte: true, creeLe: true } }),
    // Les stories de départ (sans auteur, créées par la migration) ne sont pas annoncées.
    prisma.story.findMany({ where: { creeLe: { gt: d }, auteurId: { not: null } }, orderBy: { creeLe: "desc" }, take: 10, select: { id: true, creeLe: true } }),
  ]);
  return [
    ...pubs.map((p): Activite => ({ id: `pub-${p.id}`, type: "publication", titre: "CanCham Madagascar a publié une actualité", texte: p.texte ? extrait(p.texte) : "Nouvelle photo dans le fil d’actualités.", href: "/", t: p.creeLe.getTime() })),
    ...stories.map((s): Activite => ({ id: `story-${s.id}`, type: "story", titre: "CanCham Madagascar a ajouté une story", texte: "Ouvrez l’accueil pour la découvrir.", href: "/", t: s.creeLe.getTime() })),
  ];
}
