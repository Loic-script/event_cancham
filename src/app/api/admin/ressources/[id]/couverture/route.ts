import path from "node:path";
import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { nettoyerBlocs, premierePhoto } from "@/lib/ressources/blocs";
import { json } from "@/lib/ressources/servir";
import { dossierBlocs, dossierRessource, existe, fichierPage, idValide, supprimer } from "@/lib/ressources/stockage";
import { ErreurRessource, enregistrerCouverturePerso, genererCouverture, recevoirFlux } from "@/lib/ressources/traitement";
import { refusSiNonAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

function rafraichir() {
  revalidatePath("/ressources", "layout");
  revalidatePath("/admin/ressources", "layout");
}

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/admin/ressources/[id]/couverture">) {
  const refus = await refusSiNonAdmin();
  if (refus) return refus;
  const { id } = await ctx.params;
  if (!idValide(id) || !(await prisma.ressource.findUnique({ where: { id }, select: { id: true } }))) return json(404, { ok: false, message: "Ressource introuvable." });
  try {
    const recu = await recevoirFlux(req.body, 30 * 1024 * 1024);
    const nom = await enregistrerCouverturePerso(id, recu);
    await prisma.ressource.update({ where: { id }, data: { couverture: nom, couverturePerso: true } });
    rafraichir();
    return json(200, { ok: true });
  } catch (e) {
    if (e instanceof ErreurRessource) return json(e.statut, { ok: false, message: e.message });
    return json(500, { ok: false, message: "La couverture n’a pas pu être enregistrée." });
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/admin/ressources/[id]/couverture">) {
  const refus = await refusSiNonAdmin();
  if (refus) return refus;
  const { id } = await ctx.params;
  if (!idValide(id)) return json(404, { ok: false, message: "Ressource introuvable." });
  const r = await prisma.ressource.findUnique({ where: { id }, select: { format: true, pages: true, contenu: true } });
  if (!r) return json(404, { ok: false, message: "Ressource introuvable." });
  await supprimer(path.join(dossierRessource(id), "couverture-perso.jpg"));
  const photo = r.format === "page" ? premierePhoto(nettoyerBlocs(r.contenu)) : null;
  const source = photo ? path.join(dossierBlocs(id), photo) : r.format !== "page" && r.pages > 0 ? fichierPage(id, 1) : null;
  let couverture: string | null = null;
  if (source && (await existe(source))) {
    await genererCouverture(source, path.join(dossierRessource(id), "couverture.jpg"));
    couverture = "couverture.jpg";
  }
  await prisma.ressource.update({ where: { id }, data: { couverture, couverturePerso: false } });
  rafraichir();
  return json(200, { ok: true });
}
