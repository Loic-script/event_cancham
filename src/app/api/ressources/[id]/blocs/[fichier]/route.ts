import type { NextRequest } from "next/server";
import { fichiersUtilises, nettoyerBlocs, nomFichierBlocValide } from "@/lib/ressources/blocs";
import { contexteBibliotheque } from "@/lib/ressources/contexte";
import { garderRessource } from "@/lib/ressources/garde";
import { refus, reponseFichier, reponseFlux } from "@/lib/ressources/servir";
import { fichierBloc } from "@/lib/ressources/stockage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/ressources/[id]/blocs/[fichier]">) {
  const { id, fichier } = await ctx.params;
  const garde = await garderRessource(id, "lecture");
  if (!garde.ok) return garde.reponse;
  if (!nomFichierBlocValide(fichier)) return refus(404, "Fichier introuvable");
  const { equipe } = await contexteBibliotheque();
  if (!equipe && !fichiersUtilises(nettoyerBlocs(garde.ressource.contenu)).has(fichier)) return refus(404, "Fichier introuvable");
  if (fichier.endsWith(".mp4")) return reponseFlux(req, fichierBloc(id, fichier), "video/mp4");
  return reponseFichier(fichierBloc(id, fichier), "image/webp");
}
