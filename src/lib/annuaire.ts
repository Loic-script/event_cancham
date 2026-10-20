import type { FicheComplete } from "@/lib/traversee/participants";
import { prisma } from "@/lib/prisma";

export type FicheInscrit = FicheComplete & { userId: number; inscritLe: string };

const BANDEAUX = ["salle", "ecran", "diner", "accueil", "assistance", "public", "hero", "rdv"];

export async function fichesInscrits(): Promise<FicheInscrit[]> {
  const users = await prisma.user.findMany({
    where: { acces: "MEMBRE", statut: "ACTIF" },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    select: { id: true, email: true, firstName: true, lastName: true, role: true, company: true, sector: true, bio: true, phone: true, website: true, billetPaye: true, codeBillet: true, photo: true, createdAt: true },
  });

  return users.map((u) => ({
    id: `u${u.id}`,
    userId: u.id,
    img: BANDEAUX[u.id % BANDEAUX.length],
    code: u.codeBillet,
    nom: `${u.firstName} ${u.lastName}`.trim(),
    role: u.role ?? "",
    ent: u.company ?? "",
    sect: u.sector ?? "",
    act: u.bio ?? "",
    email: u.email,
    phone: u.phone ?? "",
    website: u.website ?? "",
    billet: u.billetPaye ? "paye" : "attente",
    inscritLe: u.createdAt.toISOString(),
    photo: u.photo,
  }));
}
