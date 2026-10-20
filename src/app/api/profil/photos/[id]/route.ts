import type { NextRequest } from "next/server";
import { FORMATS_PHOTO, type FormatPhoto } from "@/lib/photos";
import { cheminPhotoProfil, idPhotoProfilValide } from "@/lib/photo-profil";
import { refus, reponseFlux } from "@/lib/ressources/servir";
import { existe } from "@/lib/ressources/stockage";
import { aAccesEspace, getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/profil/photos/[id]">) {
  const user = await getCurrentUser();
  if (!user) return refus(401, "Connexion requise");
  if (!aAccesEspace(user)) return refus(403, "Inscription non validée");
  const { id } = await ctx.params;
  if (!idPhotoProfilValide(id)) return refus(404, "Photo introuvable");

  for (const format of Object.keys(FORMATS_PHOTO) as FormatPhoto[]) {
    const chemin = cheminPhotoProfil(id, format);
    if (await existe(chemin)) return reponseFlux(req, chemin, FORMATS_PHOTO[format]);
  }
  return refus(404, "Photo introuvable");
}
