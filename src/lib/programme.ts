import { prisma } from "@/lib/prisma";
import { CATS, type ProgCat } from "@/lib/traversee/data";
import type { InscritProgramme, RendezVous, RendezVousAdmin } from "@/lib/traversee/programme";

export type { InscritProgramme, RendezVous, RendezVousAdmin };

const categorie = (c: string): ProgCat => (CATS.includes(c as ProgCat) ? (c as ProgCat) : "Panels");

const selection = {
  id: true,
  titre: true,
  categorie: true,
  heure: true,
  lieu: true,
  places: true,
  resume: true,
  details: true,
  image: true,
  _count: { select: { inscriptions: true } },
} as const;

const ORDRE = [{ ordre: "asc" }, { creeLe: "asc" }] as const;

type Ligne = { id: string; titre: string; categorie: string; heure: string; lieu: string; places: number; resume: string; details: string; image: string; _count: { inscriptions: number } };

function vue(r: Ligne, inscrit: boolean): RendezVous {
  const { _count, ...reste } = r;
  return { ...reste, categorie: categorie(r.categorie), inscrits: _count.inscriptions, inscrit };
}

async function mesInscriptions(userId: number, ids: string[]): Promise<Set<string>> {
  const miennes = await prisma.inscriptionProgramme.findMany({ where: { userId, rendezVousId: { in: ids } }, select: { rendezVousId: true } });
  return new Set(miennes.map((m) => m.rendezVousId));
}

export async function chargerProgramme(userId: number): Promise<RendezVous[]> {
  const lignes = await prisma.rendezVousProgramme.findMany({ orderBy: [...ORDRE], select: selection });
  const miennes = await mesInscriptions(
    userId,
    lignes.map((l) => l.id),
  );
  return lignes.map((l) => vue(l, miennes.has(l.id)));
}

export async function chargerRendezVous(id: string, userId: number): Promise<RendezVous | null> {
  const ligne = await prisma.rendezVousProgramme.findUnique({ where: { id }, select: selection });
  if (!ligne) return null;
  const miennes = await mesInscriptions(userId, [id]);
  return vue(ligne, miennes.has(id));
}

/** Pour /admin/programme : chaque rendez-vous avec la liste de ses inscrits. */
export async function chargerProgrammeAdmin(): Promise<RendezVousAdmin[]> {
  const lignes = await prisma.rendezVousProgramme.findMany({
    orderBy: [...ORDRE],
    select: {
      ...selection,
      inscriptions: {
        orderBy: { creeLe: "asc" },
        select: { user: { select: { id: true, firstName: true, lastName: true, company: true, email: true } } },
      },
    },
  });
  return lignes.map(({ inscriptions, ...l }) => ({
    ...vue(l, false),
    liste: inscriptions.map(({ user: u }) => ({ id: u.id, nom: `${u.firstName} ${u.lastName}`.trim(), entreprise: u.company ?? "", email: u.email })),
  }));
}
