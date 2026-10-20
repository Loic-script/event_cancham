import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { detecterPhoto } from "@/lib/photos";
import { TAILLE_MAX_PHOTO_PROFIL, cheminPhotoProfil, effacerPhotoProfil, urlPhotoProfil } from "@/lib/photo-profil";
import { prisma } from "@/lib/prisma";
import { erreurStockage, recevoirFlux } from "@/lib/ressources/reception";
import { json } from "@/lib/ressources/servir";
import { deplacer, supprimer } from "@/lib/ressources/stockage";
import { aAccesEspace, getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function rafraichir() {
  revalidatePath("/", "layout");
}

/** Remplace la photo de profil du compte connecté. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return json(401, { ok: false, message: "Connexion requise." });
  // Un compte en attente de validation prépare déjà son profil (parcours d'accueil) ; seul un compte refusé est bloqué.
  if (!aAccesEspace(user) && user.statut === "REFUSE") return json(403, { ok: false, message: "Votre inscription n’a pas été acceptée." });

  let temporaire: string | null = null;
  try {
    const recu = await recevoirFlux(req.body, TAILLE_MAX_PHOTO_PROFIL);
    temporaire = recu.chemin;
    const format = detecterPhoto(recu.entete);
    if (!format) {
      await supprimer(recu.chemin);
      return json(415, { ok: false, message: "Format non pris en charge : choisissez une photo JPEG, PNG ou WebP." });
    }
    const id = randomUUID().replace(/-/g, "");
    await deplacer(recu.chemin, cheminPhotoProfil(id, format));
    const url = urlPhotoProfil(id);
    const avant = await prisma.user.findUnique({ where: { id: user.id }, select: { photo: true } });
    await prisma.user.update({ where: { id: user.id }, data: { photo: url } });
    await effacerPhotoProfil(avant?.photo);
    rafraichir();
    return json(200, { ok: true, url });
  } catch (e) {
    if (temporaire) await supprimer(temporaire).catch(() => undefined);
    const connue = erreurStockage(e);
    if (connue) {
      if (connue.statut >= 500) console.error("Photo de profil non enregistrée :", e);
      return json(connue.statut, { ok: false, message: connue.message });
    }
    console.error("Photo de profil non enregistrée :", e);
    return json(500, { ok: false, message: "La photo n’a pas pu être enregistrée. Réessayez." });
  }
}

/** Retire la photo de profil du compte connecté. */
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return json(401, { ok: false, message: "Connexion requise." });
  const avant = await prisma.user.findUnique({ where: { id: user.id }, select: { photo: true } });
  await prisma.user.update({ where: { id: user.id }, data: { photo: null } });
  await effacerPhotoProfil(avant?.photo);
  rafraichir();
  return json(200, { ok: true });
}
