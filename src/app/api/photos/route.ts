import { randomUUID } from "node:crypto";
import { TAILLE_MAX_PHOTO, cheminPhoto, detecterPhoto } from "@/lib/photos";
import { erreurStockage, recevoirFlux } from "@/lib/ressources/reception";
import { json } from "@/lib/ressources/servir";
import { deplacer, supprimer } from "@/lib/ressources/stockage";
import { prisma } from "@/lib/prisma";
import { aAccesEspace, getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Photo ajoutée à la galerie : officielle quand elle vient de l'équipe, sinon partagée par un participant. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return json(401, { ok: false, message: "Session expirée : reconnectez-vous." });
  if (!aAccesEspace(user)) return json(403, { ok: false, message: "Votre inscription n’est pas encore validée." });

  let temporaire: string | null = null;
  try {
    const recu = await recevoirFlux(req.body, TAILLE_MAX_PHOTO);
    temporaire = recu.chemin;
    const format = detecterPhoto(recu.entete);
    if (!format) {
      await supprimer(recu.chemin);
      return json(415, { ok: false, message: "Format non pris en charge : envoyez une photo JPEG, PNG ou WebP." });
    }
    const id = randomUUID().replace(/-/g, "");
    await deplacer(recu.chemin, cheminPhoto(id, format));
    // Le fichier n'est gardé que s'il est inscrit dans la galerie.
    temporaire = cheminPhoto(id, format);
    await prisma.photoGalerie.create({ data: { id, auteurId: user.id, officielle: user.acces === "ADMIN" } });
    return json(201, { ok: true, id, url: `/api/photos/${id}` });
  } catch (e) {
    if (temporaire) await supprimer(temporaire).catch(() => undefined);
    const connue = erreurStockage(e);
    if (connue) {
      if (connue.statut >= 500) console.error("Envoi de photo impossible :", e);
      return json(connue.statut, { ok: false, message: connue.message });
    }
    console.error("Envoi de photo impossible :", e);
    return json(500, { ok: false, message: "La photo n’a pas pu être enregistrée. Réessayez." });
  }
}
