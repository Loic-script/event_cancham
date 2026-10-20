import type { NextRequest } from "next/server";
import { FORMATS_AUDIO, accesConversation, cheminAudio, idAudioValide, type FormatAudio } from "@/lib/messagerie";
import { prisma } from "@/lib/prisma";
import { refus, reponseFlux } from "@/lib/ressources/servir";
import { existe } from "@/lib/ressources/stockage";
import { aAccesEspace, getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Lecture d'un message vocal, réservée aux comptes qui ont accès à sa conversation. */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/messages/audio/[id]">) {
  const user = await getCurrentUser();
  if (!user) return refus(401, "Connexion requise");
  if (!aAccesEspace(user)) return refus(403, "Inscription non validée");
  const { id } = await ctx.params;
  if (!idAudioValide(id)) return refus(404, "Message vocal introuvable");

  const message = await prisma.message.findFirst({ where: { audio: `/api/messages/audio/${id}` }, select: { conversationId: true } });
  if (!message) return refus(404, "Message vocal introuvable");
  const autorise = (await accesConversation(message.conversationId, user, "membre")) || (await accesConversation(message.conversationId, user, "equipe"));
  if (!autorise) return refus(404, "Message vocal introuvable");

  for (const format of Object.keys(FORMATS_AUDIO) as FormatAudio[]) {
    const chemin = cheminAudio(id, format);
    if (await existe(chemin)) return reponseFlux(req, chemin, FORMATS_AUDIO[format]);
  }
  return refus(404, "Message vocal introuvable");
}
