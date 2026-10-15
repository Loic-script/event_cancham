import type { NextRequest } from "next/server";
import { nomFichierBlocValide } from "@/lib/ressources/blocs";
import { chargerRessource } from "@/lib/ressources/garde";
import { refus, reponseFichier, reponseFlux } from "@/lib/ressources/servir";
import { fichierBloc } from "@/lib/ressources/stockage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/ressources/[id]/blocs/[fichier]">) {
  const { id, fichier } = await ctx.params;
  const r = await chargerRessource(id);
  if (!r.ok) return r.reponse;
  if (!nomFichierBlocValide(fichier)) return refus(404, "Fichier introuvable");
  if (fichier.endsWith(".mp4")) return reponseFlux(req, fichierBloc(id, fichier), "video/mp4");
  return reponseFichier(fichierBloc(id, fichier), "image/webp");
}
