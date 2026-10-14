import type { NextRequest } from "next/server";
import { garderRessource } from "@/lib/ressources/garde";
import { refus, reponseFichier } from "@/lib/ressources/servir";
import { fichierRessource } from "@/lib/ressources/stockage";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/ressources/[id]/couverture">) {
  const { id } = await ctx.params;
  const garde = await garderRessource(id, "visibilite");
  if (!garde.ok) return garde.reponse;
  if (!garde.ressource.couverture) return refus(404, "Pas de couverture");
  return reponseFichier(fichierRessource(id, garde.ressource.couverture), "image/jpeg");
}
