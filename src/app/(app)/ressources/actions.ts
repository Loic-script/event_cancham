"use server";

import { revalidatePath } from "next/cache";
import { MESSAGE_INTERDIT, messageDecision } from "@/lib/ressources/acces";
import { contexteBibliotheque } from "@/lib/ressources/contexte";
import { idValide } from "@/lib/ressources/stockage";
import { creerTentative } from "@/lib/paiement/achats";
import { moyenValide } from "@/lib/paiement/prestataire";
import { prisma } from "@/lib/prisma";

export type Retour = { ok: true; url?: string } | { ok: false; message: string };

export async function terminerRessource(id: string): Promise<Retour> {
  const ctx = await contexteBibliotheque();
  if (!ctx.session || !ctx.bibliotheque) return { ok: false, message: MESSAGE_INTERDIT };
  if (!idValide(id)) return { ok: false, message: messageDecision("introuvable") };
  const r = await prisma.ressource.findUnique({ where: { id }, select: { id: true, dossierId: true, type: true } });
  if (!r) return { ok: false, message: messageDecision("introuvable") };
  const decision = ctx.lecture(r);
  if (decision !== "ok") return { ok: false, message: messageDecision(decision) };
  await prisma.lectureRessource.upsert({
    where: { utilisateurId_ressourceId: { utilisateurId: ctx.session.id, ressourceId: id } },
    update: {},
    create: { utilisateurId: ctx.session.id, ressourceId: id },
  });
  revalidatePath("/ressources", "layout");
  revalidatePath("/admin/ressources", "layout");
  return { ok: true };
}

export async function demarrerAchat(id: string, moyen: string): Promise<Retour> {
  const ctx = await contexteBibliotheque();
  if (!ctx.session || !ctx.bibliotheque) return { ok: false, message: MESSAGE_INTERDIT };
  if (ctx.equipe) return { ok: false, message: "L’équipe lit toutes les ressources sans achat." };
  if (!ctx.session.membre) return { ok: false, message: MESSAGE_INTERDIT };
  if (!idValide(id)) return { ok: false, message: messageDecision("introuvable") };
  const r = await prisma.ressource.findUnique({ where: { id }, select: { id: true, titre: true, prix: true, type: true, dossierId: true } });
  if (!r) return { ok: false, message: messageDecision("introuvable") };
  const decision = ctx.lecture(r);
  if (decision === "ok") return { ok: true, url: `/ressources/${id}` };
  if (decision !== "payant") return { ok: false, message: messageDecision(decision) };
  if (!moyenValide(moyen, r.prix)) return { ok: false, message: "Ce moyen de paiement n’est pas disponible." };
  const t = await creerTentative({ utilisateurId: ctx.session.id, membreId: ctx.session.membre.id, ressource: r, moyen });
  return { ok: true, url: `/ressources/paiement/simulation?ref=${encodeURIComponent(t.reference)}` };
}
