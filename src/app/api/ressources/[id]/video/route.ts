import type { NextRequest } from "next/server";
import { chargerRessource } from "@/lib/ressources/garde";
import { refus, reponseFlux } from "@/lib/ressources/servir";
import { fichierRessource } from "@/lib/ressources/stockage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/ressources/[id]/video">) {
  const { id } = await ctx.params;
  const r = await chargerRessource(id);
  if (!r.ok) return r.reponse;
  if (r.ressource.format !== "video" || !r.ressource.fichier) return refus(404, "Fichier manquant");
  return reponseFlux(req, fichierRessource(id, r.ressource.fichier), "video/mp4");
}
