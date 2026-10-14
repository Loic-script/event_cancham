import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { profilDe, sessionCourante, type SessionUtilisateur } from "@/lib/auth/session";
import { decisionLecture, decisionVisibilite, dossierAccessible, peutAccederBibliotheque, type Decision, type DossierLite, type Profil, type RessourceLite } from "./acces";

export type DossierComplet = DossierLite & {
  nom: string;
  couverture: string | null;
  auteurNom: string | null;
  auteurRole: string | null;
  auteurBio: string | null;
  auteurPhoto: string | null;
  ordre: number;
  updatedAt: Date;
  nbAcces: number;
};

export type Contexte = {
  session: SessionUtilisateur | null;
  profil: Profil;
  equipe: boolean;
  bibliotheque: boolean;
  dossiers: Map<string, DossierComplet>;
  accesDossiers: Set<string>;
  accesRessources: Set<string>;
  visible: (dossierId: string | null) => boolean;
  lecture: (r: RessourceLite) => Decision;
  visibilite: (r: RessourceLite) => Decision;
};

export const contexteBibliotheque = cache(async (): Promise<Contexte> => {
  const session = await sessionCourante();
  const profil = profilDe(session);
  const equipe = Boolean(profil?.equipe);
  const bibliotheque = peutAccederBibliotheque(profil);
  const membreId = profil?.membreId ?? null;
  const [liste, accesD, accesR] = await Promise.all([
    bibliotheque
      ? prisma.dossier.findMany({
          select: { id: true, parentId: true, restreint: true, nom: true, couverture: true, auteurNom: true, auteurRole: true, auteurBio: true, auteurPhoto: true, ordre: true, updatedAt: true, _count: { select: { acces: true } } },
        })
      : Promise.resolve([]),
    bibliotheque && membreId ? prisma.accesDossier.findMany({ where: { membreId }, select: { dossierId: true } }) : Promise.resolve([]),
    bibliotheque && membreId ? prisma.accesRessource.findMany({ where: { membreId }, select: { ressourceId: true } }) : Promise.resolve([]),
  ]);
  const dossiers = new Map<string, DossierComplet>(liste.map(({ _count, ...d }) => [d.id, { ...d, nbAcces: _count.acces }]));
  const accesDossiers = new Set(accesD.map((a) => a.dossierId));
  const accesRessources = new Set(accesR.map((a) => a.ressourceId));
  return {
    session,
    profil,
    equipe,
    bibliotheque,
    dossiers,
    accesDossiers,
    accesRessources,
    visible: (id) => bibliotheque && dossierAccessible(dossiers, id, accesDossiers, equipe),
    lecture: (r) => decisionLecture(profil, r, dossiers, accesDossiers, accesRessources),
    visibilite: (r) => decisionVisibilite(profil, r, dossiers, accesDossiers),
  };
});
