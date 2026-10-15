import path from "node:path";
import { racineStockage } from "@/lib/ressources/stockage";

export const TAILLE_MAX_VIDEO = 100 * 1024 * 1024;

export const FORMATS_VIDEO = { mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm" } as const;

export type FormatVideo = keyof typeof FORMATS_VIDEO;

const ID_VIDEO = /^[a-f0-9]{32}$/;

export function idVideoValide(id: unknown): id is string {
  return typeof id === "string" && ID_VIDEO.test(id);
}

export function cheminVideo(id: string, format: FormatVideo): string {
  if (!idVideoValide(id)) throw new Error("Identifiant de vidéo invalide");
  return path.join(racineStockage(), "videos", `${id}.${format}`);
}

export function detecterVideo(entete: Buffer): FormatVideo | null {
  if (entete.length >= 4 && entete[0] === 0x1a && entete[1] === 0x45 && entete[2] === 0xdf && entete[3] === 0xa3) return "webm";
  if (entete.length >= 12 && entete.subarray(4, 8).toString("latin1") === "ftyp") {
    return entete.subarray(8, 12).toString("latin1") === "qt  " ? "mov" : "mp4";
  }
  return null;
}
