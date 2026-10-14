export type FormatFichier = "pdf" | "docx" | "video" | "photo";
export type Extension = "pdf" | "docx" | "mp4" | "jpg" | "png" | "webp";
export type Detection = { format: FormatFichier; extension: Extension };

export const TAILLE_MAX = 490 * 1024 * 1024;
export const MESSAGE_FORMAT = "Format non pris en charge : envoyez un PDF, un document Word (.docx), une vidéo MP4 ou une photo JPEG, PNG ou WebP.";

const MARQUES_IMAGES = new Set(["heic", "heix", "hevc", "hevx", "heim", "heis", "avif", "avis", "mif1", "msf1", "jxl "]);

function ascii(octets: Uint8Array, debut: number, fin: number): string {
  let texte = "";
  for (let i = debut; i < fin && i < octets.length; i++) texte += String.fromCharCode(octets[i]);
  return texte;
}

export function detecterFormat(entete: Uint8Array, nomFichier: string): Detection | null {
  if (entete.length < 4) return null;
  if (ascii(entete, 0, 5) === "%PDF-") return { format: "pdf", extension: "pdf" };
  if (entete[0] === 0x50 && entete[1] === 0x4b && entete[2] === 0x03 && entete[3] === 0x04) {
    return /\.docx$/i.test(nomFichier.trim()) ? { format: "docx", extension: "docx" } : null;
  }
  if (entete.length >= 12 && ascii(entete, 4, 8) === "ftyp") {
    const marque = ascii(entete, 8, 12).toLowerCase();
    if (MARQUES_IMAGES.has(marque) || marque === "qt  ") return null;
    return { format: "video", extension: "mp4" };
  }
  if (entete[0] === 0xff && entete[1] === 0xd8 && entete[2] === 0xff) return { format: "photo", extension: "jpg" };
  if (entete.length >= 8 && entete[0] === 0x89 && ascii(entete, 1, 4) === "PNG" && entete[4] === 0x0d && entete[5] === 0x0a && entete[6] === 0x1a && entete[7] === 0x0a) {
    return { format: "photo", extension: "png" };
  }
  if (entete.length >= 12 && ascii(entete, 0, 4) === "RIFF" && ascii(entete, 8, 12) === "WEBP") return { format: "photo", extension: "webp" };
  return null;
}

export function detecterImage(entete: Uint8Array): Extension | null {
  const d = detecterFormat(entete, "");
  return d?.format === "photo" ? d.extension : null;
}

export function tailleLisible(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  const unites = ["Ko", "Mo", "Go"];
  let valeur = octets / 1024;
  let i = 0;
  while (valeur >= 1024 && i < unites.length - 1) {
    valeur /= 1024;
    i += 1;
  }
  const arrondi = valeur >= 100 ? Math.round(valeur).toString() : valeur.toFixed(1).replace(/\.0$/, "");
  return `${arrondi.replace(".", ",")} ${unites[i]}`;
}
