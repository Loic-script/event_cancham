import { randomUUID } from "node:crypto";
import { erreurStockage, recevoirFlux } from "@/lib/ressources/reception";
import { json } from "@/lib/ressources/servir";
import { deplacer, supprimer } from "@/lib/ressources/stockage";
import { getCurrentUser } from "@/lib/session";
import { TAILLE_MAX_VIDEO, cheminVideo, detecterVideo } from "@/lib/videos";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  if (!(await getCurrentUser())) return json(401, { ok: false, message: "Connexion requise." });

  let temporaire: string | null = null;
  try {
    const recu = await recevoirFlux(req.body, TAILLE_MAX_VIDEO);
    temporaire = recu.chemin;
    const format = detecterVideo(recu.entete);
    if (!format) {
      await supprimer(recu.chemin);
      return json(415, { ok: false, message: "Format non pris en charge : envoyez une vidéo MP4, MOV ou WebM." });
    }
    const id = randomUUID().replace(/-/g, "");
    await deplacer(recu.chemin, cheminVideo(id, format));
    return json(201, { ok: true, url: `/api/videos/${id}` });
  } catch (e) {
    if (temporaire) await supprimer(temporaire).catch(() => undefined);
    const connue = erreurStockage(e);
    if (connue) {
      if (connue.statut >= 500) console.error("Envoi de vidéo impossible :", e);
      return json(connue.statut, { ok: false, message: connue.message });
    }
    console.error("Envoi de vidéo impossible :", e);
    return json(500, { ok: false, message: "La vidéo n’a pas pu être enregistrée. Réessayez." });
  }
}
