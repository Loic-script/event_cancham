import { prisma } from "@/lib/prisma";
import type { AnnonceType } from "@/lib/traversee/data";

/** Annonce vue côté navigateur : même forme que la carte AnnonceCard (t en millisecondes), et « vue » pour ce compte. */
export type AnnonceVue = { id: string; titre: string; message: string; type: AnnonceType; cta: string; img?: string; t: number; vue: boolean };
export type AnnonceAdmin = AnnonceVue & { vues: number };

const TYPES: AnnonceType[] = ["info", "programme", "urgent"];
const type = (v: string): AnnonceType => (TYPES.includes(v as AnnonceType) ? (v as AnnonceType) : "info");

const selection = { id: true, titre: true, message: true, type: true, cta: true, image: true, creeLe: true } as const;

/** Annonces des 60 derniers jours (20 au plus), avec l'état « vue » de ce participant. */
export async function annoncesPour(userId: number): Promise<AnnonceVue[]> {
  const lignes = await prisma.annonce.findMany({
    where: { creeLe: { gt: new Date(Date.now() - 60 * 86_400_000) } },
    orderBy: { creeLe: "desc" },
    take: 20,
    select: { ...selection, vues: { where: { userId }, select: { userId: true } } },
  });
  return lignes.map((a) => ({ id: a.id, titre: a.titre, message: a.message, type: type(a.type), cta: a.cta, img: a.image ?? undefined, t: a.creeLe.getTime(), vue: a.vues.length > 0 }));
}

/** Historique du back-office, avec le nombre de participants qui ont vu chaque annonce. */
export async function annoncesAdmin(): Promise<AnnonceAdmin[]> {
  const lignes = await prisma.annonce.findMany({ orderBy: { creeLe: "desc" }, take: 100, select: { ...selection, _count: { select: { vues: true } } } });
  return lignes.map((a) => ({ id: a.id, titre: a.titre, message: a.message, type: type(a.type), cta: a.cta, img: a.image ?? undefined, t: a.creeLe.getTime(), vue: true, vues: a._count.vues }));
}
