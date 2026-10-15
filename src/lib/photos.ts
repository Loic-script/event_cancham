import path from "node:path";
import { racineStockage } from "@/lib/ressources/stockage";

export const TAILLE_MAX_PHOTO = 15 * 1024 * 1024;

export const FORMATS_PHOTO = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;

export type FormatPhoto = keyof typeof FORMATS_PHOTO;

const ID_PHOTO = /^[a-f0-9]{32}$/;

export function idPhotoValide(id: unknown): id is string {
  return typeof id === "string" && ID_PHOTO.test(id);
}

export function cheminPhoto(id: string, format: FormatPhoto): string {
  if (!idPhotoValide(id)) throw new Error("Identifiant de photo invalide");
  return path.join(racineStockage(), "photos", `${id}.${format}`);
}

export function detecterPhoto(entete: Buffer): FormatPhoto | null {
  if (entete.length >= 3 && entete[0] === 0xff && entete[1] === 0xd8 && entete[2] === 0xff) return "jpg";
  if (entete.length >= 8 && entete.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (entete.length >= 12 && entete.subarray(0, 4).toString("latin1") === "RIFF" && entete.subarray(8, 12).toString("latin1") === "WEBP") return "webp";
  return null;
}
