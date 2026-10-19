"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { aAccesEspace, getCurrentUser } from "@/lib/session";

type Resultat = { error: string | null; inscrit?: boolean; inscrits?: number };

/** Inscrit le participant au rendez-vous, ou le désinscrit s'il l'était déjà. */
export async function basculerInscription(id: unknown): Promise<Resultat> {
  const user = await getCurrentUser();
  if (!user || !aAccesEspace(user)) return { error: "Votre session a expiré ou votre accès n’est pas encore validé." };
  if (typeof id !== "string") return { error: "Ce rendez-vous n’existe plus." };

  const resultat = await prisma.$transaction(async (tx): Promise<Resultat> => {
    // Verrou sur le rendez-vous : deux inscriptions simultanées ne dépassent pas les places.
    const [rdv] = await tx.$queryRaw<{ places: number }[]>`SELECT "places" FROM "programme" WHERE "id" = ${id} FOR UPDATE`;
    if (!rdv) return { error: "Ce rendez-vous n’existe plus." };

    const { count: retire } = await tx.inscriptionProgramme.deleteMany({ where: { rendezVousId: id, userId: user.id } });
    if (!retire) {
      if (rdv.places && (await tx.inscriptionProgramme.count({ where: { rendezVousId: id } })) >= rdv.places) return { error: "Ce rendez-vous est complet." };
      await tx.inscriptionProgramme.create({ data: { rendezVousId: id, userId: user.id } });
    }
    return { error: null, inscrit: !retire, inscrits: await tx.inscriptionProgramme.count({ where: { rendezVousId: id } }) };
  });

  if (!resultat.error) {
    revalidatePath("/programme", "layout");
    revalidatePath("/admin/programme");
  }
  return resultat;
}
