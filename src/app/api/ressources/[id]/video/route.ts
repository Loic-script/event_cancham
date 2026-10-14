import type { NextRequest } from "next/server";
import { garderRessource } from "@/lib/ressources/garde";
import { refus, reponseFlux } from "@/lib/ressources/servir";
import { fichierRessource } from "@/lib/ressources/stockage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/ressources/[id]/video">) {
  const { id } = await ctx.params;
  const garde = await garderRessource(id, "lecture");
  if (!garde.ok) return garde.reponse;
  if (garde.ressource.format !== "video" || !garde.ressource.fichier) return refus(404, "Fichier manquant");
  return reponseFlux(req, fichierRessource(id, garde.ressource.fichier), "video/mp4");
}
