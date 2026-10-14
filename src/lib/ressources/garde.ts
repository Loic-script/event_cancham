import { prisma } from "@/lib/prisma";
import { refus } from "./servir";
import { idValide } from "./stockage";

export type RessourceServie = {
  id: string;
  format: "pdf" | "docx" | "video" | "photo" | "page";
  pages: number;
  fichier: string | null;
  couverture: string | null;
  contenu: unknown;
};

export async function chargerRessource(id: string): Promise<{ ok: true; ressource: RessourceServie } | { ok: false; reponse: Response }> {
  if (!idValide(id)) return { ok: false, reponse: refus(404, "Ressource introuvable") };
  const ressource = await prisma.ressource.findUnique({ where: { id }, select: { id: true, format: true, pages: true, fichier: true, couverture: true, contenu: true } });
  if (!ressource) return { ok: false, reponse: refus(404, "Ressource introuvable") };
  return { ok: true, ressource };
}
