import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { refus, reponseFichier } from "@/lib/ressources/servir";
import { fichierImageDossier, idValide } from "@/lib/ressources/stockage";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/dossiers/[id]/image/[type]">) {
  const { id, type } = await ctx.params;
  if (!idValide(id)) return refus(404, "Dossier introuvable");
  const d = await prisma.dossier.findUnique({ where: { id }, select: { couverture: true, auteurPhoto: true } });
  if (!d) return refus(404, "Dossier introuvable");
  const nom = type === "couverture" ? d.couverture : type === "auteur" ? d.auteurPhoto : null;
  if (!nom) return refus(404, "Image introuvable");
  return reponseFichier(fichierImageDossier(id, nom), "image/jpeg");
}
