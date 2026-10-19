import type { NextRequest } from "next/server";
import { refus, reponseFlux } from "@/lib/ressources/servir";
import { existe } from "@/lib/ressources/stockage";
import { aAccesEspace, getCurrentUser } from "@/lib/session";
import { FORMATS_VIDEO, cheminVideo, idVideoValide, type FormatVideo } from "@/lib/videos";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/videos/[id]">) {
  const user = await getCurrentUser();
  if (!user) return refus(401, "Connexion requise");
  if (!aAccesEspace(user)) return refus(403, "Inscription non validée");
  const { id } = await ctx.params;
  if (!idVideoValide(id)) return refus(404, "Vidéo introuvable");

  for (const format of Object.keys(FORMATS_VIDEO) as FormatVideo[]) {
    const chemin = cheminVideo(id, format);
    if (await existe(chemin)) return reponseFlux(req, chemin, FORMATS_VIDEO[format]);
  }
  return refus(404, "Vidéo introuvable");
}
