import type { NextRequest } from "next/server";
import { FORMATS_PHOTO, cheminPhoto, idPhotoValide, type FormatPhoto } from "@/lib/photos";
import { refus, reponseFlux } from "@/lib/ressources/servir";
import { existe } from "@/lib/ressources/stockage";
import { aAccesEspace, getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const FORMATS = Object.keys(FORMATS_PHOTO) as FormatPhoto[];

export async function GET(req: NextRequest, ctx: RouteContext<"/api/photos/[id]">) {
  const user = await getCurrentUser();
  if (!user) return refus(401, "Connexion requise");
  if (!aAccesEspace(user)) return refus(403, "Inscription non validée");
  const { id } = await ctx.params;
  if (!idPhotoValide(id)) return refus(404, "Photo introuvable");

  for (const format of FORMATS) {
    const chemin = cheminPhoto(id, format);
    if (await existe(chemin)) return reponseFlux(req, chemin, FORMATS_PHOTO[format]);
  }
  return refus(404, "Photo introuvable");
}
