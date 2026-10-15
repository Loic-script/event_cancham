import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { enregistrerImageDossier } from "@/lib/ressources/admin";
import { detecterImage } from "@/lib/ressources/formats";
import { json } from "@/lib/ressources/servir";
import { fichierImageDossier, idValide, supprimer } from "@/lib/ressources/stockage";
import { ErreurRessource, recevoirFlux } from "@/lib/ressources/traitement";

export const dynamic = "force-dynamic";

function champ(type: string) {
  return type === "couverture" ? ("couverture" as const) : type === "auteur" ? ("auteurPhoto" as const) : null;
}

function rafraichir() {
  revalidatePath("/ressources", "layout");
  revalidatePath("/admin/ressources", "layout");
}

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/admin/dossiers/[id]/image/[type]">) {
  const { id, type } = await ctx.params;
  const c = champ(type);
  if (!c || !idValide(id)) return json(404, { ok: false, message: "Dossier introuvable." });
  const d = await prisma.dossier.findUnique({ where: { id }, select: { couverture: true, auteurPhoto: true } });
  if (!d) return json(404, { ok: false, message: "Dossier introuvable." });
  try {
    const recu = await recevoirFlux(req.body, 30 * 1024 * 1024);
    try {
      if (!detecterImage(recu.entete)) throw new ErreurRessource("Envoyez une photo JPEG, PNG ou WebP.", 415);
      const nom = await enregistrerImageDossier(id, recu.chemin, c === "auteurPhoto" ? "auteur" : "couverture");
      const ancien = d[c];
      await prisma.dossier.update({ where: { id }, data: { [c]: nom } });
      if (ancien) await supprimer(fichierImageDossier(id, ancien));
    } finally {
      await supprimer(recu.chemin);
    }
    rafraichir();
    return json(200, { ok: true });
  } catch (e) {
    if (e instanceof ErreurRessource) return json(e.statut, { ok: false, message: e.message });
    return json(500, { ok: false, message: "L’image n’a pas pu être enregistrée." });
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/admin/dossiers/[id]/image/[type]">) {
  const { id, type } = await ctx.params;
  const c = champ(type);
  if (!c || !idValide(id)) return json(404, { ok: false, message: "Dossier introuvable." });
  const d = await prisma.dossier.findUnique({ where: { id }, select: { couverture: true, auteurPhoto: true } });
  if (!d) return json(404, { ok: false, message: "Dossier introuvable." });
  const ancien = d[c];
  await prisma.dossier.update({ where: { id }, data: { [c]: null } });
  if (ancien) await supprimer(fichierImageDossier(id, ancien));
  rafraichir();
  return json(200, { ok: true });
}
