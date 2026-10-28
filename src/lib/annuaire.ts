import type { FicheComplete } from "@/lib/traversee/participants";
import { prisma } from "@/lib/prisma";
import { LOGO_BLANC } from "@/lib/traversee/data";

export type FicheInscrit = FicheComplete & { userId: number; inscritLe: string };

export async function fichesInscrits(): Promise<FicheInscrit[]> {
  const users = await prisma.user.findMany({
    where: { acces: "MEMBRE", statut: "ACTIF" },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    select: { id: true, email: true, firstName: true, lastName: true, role: true, company: true, sector: true, bio: true, phone: true, website: true, billetPaye: true, codeBillet: true, photo: true, couverture: true, couverturePosition: true, createdAt: true },
  });

  return users.map((u) => ({
    id: `u${u.id}`,
    userId: u.id,
    // Sans couverture : le logo IMPACT 261 sur fond bleu nuit (styleCouverture, composants de l'annuaire).
    img: u.couverture ?? LOGO_BLANC,
    imgPosition: u.couverture ? u.couverturePosition : 50,
    couvertureDefaut: !u.couverture,
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
