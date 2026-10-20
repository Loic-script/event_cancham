import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { DUREE_MAX_AUDIO, TAILLE_MAX_AUDIO, accesConversation, ajouterMessage, auteurEstMoi, cheminAudio, detecterAudio, marquerLu, vueMessage } from "@/lib/messagerie";
import { erreurStockage, recevoirFlux } from "@/lib/ressources/reception";
import { json } from "@/lib/ressources/servir";
import { deplacer, supprimer } from "@/lib/ressources/stockage";
import { aAccesEspace, getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Message vocal : ?cote=membre|equipe&secondes=12, corps = l'enregistrement du navigateur. */
export async function POST(req: NextRequest, ctx: RouteContext<"/api/messages/[id]/audio">) {
  const user = await getCurrentUser();
  if (!user) return json(401, { ok: false, message: "Connexion requise." });
  if (!aAccesEspace(user)) return json(403, { ok: false, message: "Votre inscription n’est pas encore validée." });
  const { id } = await ctx.params;
  const cote = req.nextUrl.searchParams.get("cote") === "equipe" ? "equipe" : "membre";
  const c = await accesConversation(id, user, cote);
  if (!c) return json(404, { ok: false, message: "Cette conversation n’existe plus." });
  const secondes = Math.min(DUREE_MAX_AUDIO, Math.max(1, Math.round(Number(req.nextUrl.searchParams.get("secondes")) || 1)));

  let temporaire: string | null = null;
  try {
    const recu = await recevoirFlux(req.body, TAILLE_MAX_AUDIO);
    temporaire = recu.chemin;
    const format = detecterAudio(recu.entete);
    if (!format) {
      await supprimer(recu.chemin);
      return json(415, { ok: false, message: "Ce message vocal n’a pas pu être lu. Réessayez." });
    }
    const fichier = randomUUID().replace(/-/g, "");
    await deplacer(recu.chemin, cheminAudio(fichier, format));
    const m = await ajouterMessage(c, user.id, { audio: `/api/messages/audio/${fichier}`, audioSecondes: secondes });
    await marquerLu(c, user, cote);
    revalidatePath("/messages", "layout");
    revalidatePath("/admin/messagerie", "layout");
    return json(201, { ok: true, message: vueMessage(m, auteurEstMoi(c, user, cote)) });
  } catch (e) {
    if (temporaire) await supprimer(temporaire).catch(() => undefined);
    const connue = erreurStockage(e);
    if (connue) return json(connue.statut, { ok: false, message: connue.statut === 413 ? "Message vocal trop long." : connue.message });
    console.error("Message vocal non enregistré :", e);
    return json(500, { ok: false, message: "Le message vocal n’a pas pu être envoyé. Réessayez." });
  }
}
