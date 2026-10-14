import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { journaliser } from "@/lib/ressources/admin";
import { json } from "@/lib/ressources/servir";
import { idValide } from "@/lib/ressources/stockage";
import { nomFichierEntete } from "@/lib/ressources/televersement";
import { ErreurRessource, recevoirFlux, traiterEnvoi } from "@/lib/ressources/traitement";

export const dynamic = "force-dynamic";
export const maxDuration = 900;

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/admin/ressources/[id]/fichier">) {
  const { id } = await ctx.params;
  if (!idValide(id)) return json(404, { ok: false, message: "Ressource introuvable." });
  const r = await prisma.ressource.findUnique({ where: { id }, select: { id: true, titre: true, couverturePerso: true } });
  if (!r) return json(404, { ok: false, message: "Ressource introuvable." });
  const nom = nomFichierEntete(req.headers.get("x-nom-fichier"));
  try {
    const recu = await recevoirFlux(req.body);
    const res = await traiterEnvoi(id, recu, nom, r.couverturePerso);
    await prisma.ressource.update({
      where: { id },
      data: {
        format: res.format,
        fichier: res.fichier,
        pages: res.pages,
        taille: res.taille,
        tailleOctets: BigInt(res.tailleOctets),
        couverture: res.couverture,
        couverturePerso: res.couverture === "couverture-perso.jpg",
        contenu: Prisma.DbNull,
      },
    });
    await journaliser("fichier_remplace", `${r.titre} · ${nom}`);
    revalidatePath("/ressources", "layout");
    revalidatePath("/admin/ressources", "layout");
    return json(200, { ok: true, id });
  } catch (e) {
    if (e instanceof ErreurRessource) return json(e.statut, { ok: false, message: e.message });
    return json(500, { ok: false, message: `« ${nom} » n’a pas pu être converti, enregistrez-le en PDF.` });
  }
}
