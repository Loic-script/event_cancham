import type { NextRequest } from "next/server";
import { garderRessource } from "@/lib/ressources/garde";
import { refus, reponseFichier } from "@/lib/ressources/servir";
import { fichierPage, numeroPageValide } from "@/lib/ressources/stockage";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/ressources/[id]/pages/[n]">) {
  const { id, n } = await ctx.params;
  const garde = await garderRessource(id, "lecture");
  if (!garde.ok) return garde.reponse;
  if (!numeroPageValide(n) || Number(n) > garde.ressource.pages) return refus(404, "Page introuvable");
  return reponseFichier(fichierPage(id, n), "image/png");
}
