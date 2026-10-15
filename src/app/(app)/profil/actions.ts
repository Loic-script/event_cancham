"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const LIMITES = { firstName: 60, lastName: 60, company: 80, role: 80, sector: 60, bio: 600, phone: 30, website: 200, city: 80 } as const;

type Champ = keyof typeof LIMITES;

export async function enregistrerProfil(champs: Partial<Record<Champ, string>>): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  const data: Prisma.UserUpdateInput = {};
  for (const [cle, max] of Object.entries(LIMITES) as [Champ, number][]) {
    const valeur = champs[cle];
    if (typeof valeur !== "string") continue;
    const propre = valeur.trim().slice(0, max);
    if (cle === "firstName" || cle === "lastName") {
      if (propre) data[cle] = propre;
    } else {
      data[cle] = propre || null;
    }
  }
  if (!Object.keys(data).length) return { ok: true };

  await prisma.user.update({ where: { id: user.id }, data });
  revalidatePath("/annuaire");
  revalidatePath("/admin/participants");
  return { ok: true };
}
