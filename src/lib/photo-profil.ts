import path from "node:path";
import { FORMATS_PHOTO, type FormatPhoto } from "@/lib/photos";
import { racineStockage, supprimer } from "@/lib/ressources/stockage";

/** Photos de profil : réduites à 640 px dans le navigateur, rangées dans stockage/profils, servies par /api/profil/photos/<id>. */
export const TAILLE_MAX_PHOTO_PROFIL = 5 * 1024 * 1024;

const ID = /^[a-f0-9]{32}$/;
const URL_PHOTO = /^\/api\/profil\/photos\/([a-f0-9]{32})$/;

export const idPhotoProfilValide = (id: unknown): id is string => typeof id === "string" && ID.test(id);

export function cheminPhotoProfil(id: string, format: FormatPhoto): string {
  if (!idPhotoProfilValide(id)) throw new Error("Identifiant de photo invalide");
  return path.join(racineStockage(), "profils", `${id}.${format}`);
}

export const urlPhotoProfil = (id: string) => `/api/profil/photos/${id}`;

/** Efface du stockage le fichier d'une photo de profil remplacée ou retirée. */
export async function effacerPhotoProfil(url: string | null | undefined): Promise<void> {
  const id = url?.match(URL_PHOTO)?.[1];
  if (!id) return;
  await Promise.all((Object.keys(FORMATS_PHOTO) as FormatPhoto[]).map((f) => supprimer(cheminPhotoProfil(id, f)))).catch((e) => console.error("Ancienne photo de profil non effacée :", e));
}
