import { randomUUID } from "node:crypto";
import { TAILLE_MAX_IMAGE_FIL, cheminImageFil } from "@/lib/fil";
import { detecterPhoto } from "@/lib/photos";
import { erreurStockage, recevoirFlux } from "@/lib/ressources/reception";
import { json } from "@/lib/ressources/servir";
import { deplacer, supprimer } from "@/lib/ressources/stockage";
import { refusSiSansAcces } from "@/lib/session";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Photo jointe à une publication du fil : renvoie son adresse, à transmettre à l'action publier. */
export async function POST(req: Request) {
  const refus = await refusSiSansAcces();
  if (refus) return refus;

  let temporaire: string | null = null;
  try {
    const recu = await recevoirFlux(req.body, TAILLE_MAX_IMAGE_FIL);
    temporaire = recu.chemin;
    const format = detecterPhoto(recu.entete);
    if (!format) {
      await supprimer(recu.chemin);
      return json(415, { ok: false, message: "Format non pris en charge : envoyez une photo JPEG, PNG ou WebP." });
    }
    const id = randomUUID().replace(/-/g, "");
    await deplacer(recu.chemin, cheminImageFil(id, format));
    return json(201, { ok: true, url: `/api/fil/images/${id}` });
  } catch (e) {
    if (temporaire) await supprimer(temporaire).catch(() => undefined);
    const connue = erreurStockage(e);
    if (connue) {
      if (connue.statut >= 500) console.error("Envoi de photo du fil impossible :", e);
      return json(connue.statut, { ok: false, message: connue.message });
    }
    console.error("Envoi de photo du fil impossible :", e);
    return json(500, { ok: false, message: "La photo n’a pas pu être enregistrée. Réessayez." });
  }
}
