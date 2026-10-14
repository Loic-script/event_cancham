"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { COOKIE_LECTEUR, lecteurValide } from "@/lib/ressources/contexte";
import { idValide } from "@/lib/ressources/stockage";
import { prisma } from "@/lib/prisma";

export type Retour = { ok: true } | { ok: false; message: string };

export async function terminerRessource(id: string): Promise<Retour> {
  if (!idValide(id) || !(await prisma.ressource.findUnique({ where: { id }, select: { id: true } }))) return { ok: false, message: "Ressource introuvable." };
  const magasin = await cookies();
  let lecteur = magasin.get(COOKIE_LECTEUR)?.value;
  if (!lecteurValide(lecteur)) {
    lecteur = randomUUID();
    magasin.set(COOKIE_LECTEUR, lecteur, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
  await prisma.lectureRessource.upsert({
    where: { lecteur_ressourceId: { lecteur, ressourceId: id } },
    update: {},
    create: { lecteur, ressourceId: id },
  });
  revalidatePath("/ressources", "layout");
  revalidatePath("/admin/ressources", "layout");
  return { ok: true };
}
