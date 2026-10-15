import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { detecterFormat } from "@/lib/ressources/formats";
import { json } from "@/lib/ressources/servir";
import { deplacer, fichierBloc, idValide, supprimer } from "@/lib/ressources/stockage";
import { ErreurRessource, normaliserImage, recevoirFlux } from "@/lib/ressources/traitement";

export const dynamic = "force-dynamic";
export const maxDuration = 900;

export async function POST(req: NextRequest, ctx: RouteContext<"/api/admin/ressources/[id]/blocs">) {
  const { id } = await ctx.params;
  if (!idValide(id)) return json(404, { ok: false, message: "Ressource introuvable." });
  const r = await prisma.ressource.findUnique({ where: { id }, select: { format: true } });
  if (!r || r.format !== "page") return json(404, { ok: false, message: "Page introuvable." });
  try {
    const recu = await recevoirFlux(req.body);
    const d = detecterFormat(recu.entete, "");
    if (d?.format === "photo") {
      const nom = `${randomUUID()}.webp`;
      try {
        await normaliserImage(recu.chemin, fichierBloc(id, nom), "webp", 2000);
      } catch {
        throw new ErreurRessource("Cette photo n’a pas pu être lue.", 422);
      } finally {
        await supprimer(recu.chemin);
      }
      return json(201, { ok: true, fichier: nom, type: "photo" });
    }
    if (d?.format === "video") {
      const nom = `${randomUUID()}.mp4`;
      await deplacer(recu.chemin, fichierBloc(id, nom));
      return json(201, { ok: true, fichier: nom, type: "video" });
    }
    await supprimer(recu.chemin);
    return json(415, { ok: false, message: "Envoyez une photo JPEG, PNG ou WebP, ou une vidéo MP4." });
  } catch (e) {
    if (e instanceof ErreurRessource) return json(e.statut, { ok: false, message: e.message });
    return json(500, { ok: false, message: "Le fichier n’a pas pu être enregistré." });
  }
}
