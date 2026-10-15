import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { DossierLite } from "./dossiers";

export const COOKIE_LECTEUR = "cc_lecteur";
const LECTEUR = /^[a-f0-9-]{36}$/;

export type DossierComplet = DossierLite & {
  nom: string;
  couverture: string | null;
  auteurNom: string | null;
  auteurRole: string | null;
  auteurBio: string | null;
  auteurPhoto: string | null;
  ordre: number;
  updatedAt: Date;
};

export type Contexte = {
  lecteur: string | null;
  dossiers: Map<string, DossierComplet>;
};

export function lecteurValide(v: string | undefined | null): v is string {
  return typeof v === "string" && LECTEUR.test(v);
}

export const lecteurCourant = cache(async (): Promise<string | null> => {
  const v = (await cookies()).get(COOKIE_LECTEUR)?.value;
  return lecteurValide(v) ? v : null;
});

export const contexteBibliotheque = cache(async (): Promise<Contexte> => {
  const [lecteur, liste] = await Promise.all([
    lecteurCourant(),
    prisma.dossier.findMany({ select: { id: true, parentId: true, nom: true, couverture: true, auteurNom: true, auteurRole: true, auteurBio: true, auteurPhoto: true, ordre: true, updatedAt: true } }),
  ]);
  return { lecteur, dossiers: new Map(liste.map((d) => [d.id, d])) };
});
