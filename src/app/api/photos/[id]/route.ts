import type { NextRequest } from "next/server";
import { FORMATS_PHOTO, cheminPhoto, idPhotoValide, type FormatPhoto } from "@/lib/photos";
import { json, refus, reponseFlux } from "@/lib/ressources/servir";
import { existe, supprimer } from "@/lib/ressources/stockage";
import { getCurrentUser, refusSiNonAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

const FORMATS = Object.keys(FORMATS_PHOTO) as FormatPhoto[];

export async function GET(req: NextRequest, ctx: RouteContext<"/api/photos/[id]">) {
  if (!(await getCurrentUser())) return refus(401, "Connexion requise");
  const { id } = await ctx.params;
  if (!idPhotoValide(id)) return refus(404, "Photo introuvable");

  for (const format of FORMATS) {
    const chemin = cheminPhoto(id, format);
    if (await existe(chemin)) return reponseFlux(req, chemin, FORMATS_PHOTO[format]);
  }
  return refus(404, "Photo introuvable");
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/photos/[id]">) {
  const refusAdmin = await refusSiNonAdmin();
  if (refusAdmin) return refusAdmin;
  const { id } = await ctx.params;
  if (!idPhotoValide(id)) return json(404, { ok: false, message: "Photo introuvable." });
  await Promise.all(FORMATS.map((format) => supprimer(cheminPhoto(id, format))));
  return json(200, { ok: true });
}
