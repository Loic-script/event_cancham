import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { journaliser, prochainOrdre, validerMeta } from "@/lib/ressources/admin";
import { json } from "@/lib/ressources/servir";
import { dossierRessource, supprimer } from "@/lib/ressources/stockage";
import { lireEnteteJson, nomFichierEntete } from "@/lib/ressources/televersement";
import { ErreurRessource, recevoirFlux, traiterEnvoi } from "@/lib/ressources/traitement";

export const dynamic = "force-dynamic";
export const maxDuration = 900;

export async function POST(req: Request) {
  const meta = await validerMeta(lireEnteteJson(req.headers.get("x-meta")));
  if (!meta.ok) return json(400, { ok: false, message: meta.message });
  const nom = nomFichierEntete(req.headers.get("x-nom-fichier"));
  let id: string | null = null;
  try {
    const recu = await recevoirFlux(req.body);
    const r = await prisma.ressource.create({ data: { ...meta.valeur, format: "pdf", ordre: await prochainOrdre(meta.valeur.dossierId) }, select: { id: true } });
    id = r.id;
    const res = await traiterEnvoi(r.id, recu, nom, false);
    await prisma.ressource.update({
      where: { id: r.id },
      data: { format: res.format, fichier: res.fichier, pages: res.pages, taille: res.taille, tailleOctets: BigInt(res.tailleOctets), couverture: res.couverture, couverturePerso: false, date: new Date() },
    });
    await journaliser("ressource_creee", `${meta.valeur.titre} · ${nom}`);
    revalidatePath("/ressources", "layout");
    revalidatePath("/admin/ressources", "layout");
    return json(201, { ok: true, id: r.id });
  } catch (e) {
    if (id) {
      await prisma.ressource.delete({ where: { id } }).catch(() => undefined);
      await supprimer(dossierRessource(id));
    }
    if (e instanceof ErreurRessource) return json(e.statut, { ok: false, message: e.message });
    return json(500, { ok: false, message: `« ${nom} » n’a pas pu être converti, enregistrez-le en PDF.` });
  }
}
