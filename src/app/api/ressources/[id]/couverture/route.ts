import type { NextRequest } from "next/server";
import { chargerRessource } from "@/lib/ressources/garde";
import { refus, reponseFichier } from "@/lib/ressources/servir";
import { fichierRessource } from "@/lib/ressources/stockage";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/ressources/[id]/couverture">) {
  const { id } = await ctx.params;
  const r = await chargerRessource(id);
  if (!r.ok) return r.reponse;
  if (!r.ressource.couverture) return refus(404, "Pas de couverture");
  return reponseFichier(fichierRessource(id, r.ressource.couverture), "image/jpeg");
}
