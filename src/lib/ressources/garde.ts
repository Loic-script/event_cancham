import { prisma } from "@/lib/prisma";
import { messageDecision, statutHttp, type Decision } from "./acces";
import { contexteBibliotheque, type Contexte } from "./contexte";
import { refus } from "./servir";
import { idValide } from "./stockage";

export type RessourceGardee = {
  id: string;
  titre: string;
  format: "pdf" | "docx" | "video" | "photo" | "page";
  type: "gratuit" | "payant";
  dossierId: string | null;
  pages: number;
  fichier: string | null;
  couverture: string | null;
  contenu: unknown;
};

export type ResultatGarde = { ok: true; ressource: RessourceGardee; ctx: Contexte } | { ok: false; reponse: Response };

export async function garderRessource(id: string, niveau: "lecture" | "visibilite"): Promise<ResultatGarde> {
  const ctx = await contexteBibliotheque();
  if (!ctx.bibliotheque) return { ok: false, reponse: refus(403, messageDecision("interdit")) };
  if (!idValide(id)) return { ok: false, reponse: refus(404, messageDecision("introuvable")) };
  const ressource = await prisma.ressource.findUnique({
    where: { id },
    select: { id: true, titre: true, format: true, type: true, dossierId: true, pages: true, fichier: true, couverture: true, contenu: true },
  });
  if (!ressource) return { ok: false, reponse: refus(404, messageDecision("introuvable")) };
  const decision: Decision = niveau === "lecture" ? ctx.lecture(ressource) : ctx.visibilite(ressource);
  if (decision !== "ok") return { ok: false, reponse: refus(statutHttp(decision), messageDecision(decision)) };
  return { ok: true, ressource, ctx };
}
