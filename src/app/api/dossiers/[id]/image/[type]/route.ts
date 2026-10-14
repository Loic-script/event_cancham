import type { NextRequest } from "next/server";
import { messageDecision } from "@/lib/ressources/acces";
import { contexteBibliotheque } from "@/lib/ressources/contexte";
import { refus, reponseFichier } from "@/lib/ressources/servir";
import { fichierImageDossier, idValide } from "@/lib/ressources/stockage";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/dossiers/[id]/image/[type]">) {
  const { id, type } = await ctx.params;
  const c = await contexteBibliotheque();
  if (!c.bibliotheque) return refus(403, messageDecision("interdit"));
  if (!idValide(id) || !c.dossiers.has(id) || !c.visible(id)) return refus(404, "Dossier introuvable");
  const d = c.dossiers.get(id)!;
  const nom = type === "couverture" ? d.couverture : type === "auteur" ? d.auteurPhoto : null;
  if (!nom) return refus(404, "Image introuvable");
  return reponseFichier(fichierImageDossier(id, nom), "image/jpeg");
}
