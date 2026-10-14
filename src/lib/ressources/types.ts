export type Categorie = "guide" | "modele" | "formation" | "rapport";
export type Format = "pdf" | "docx" | "video" | "photo" | "page";
export type TypeAcces = "gratuit" | "payant";

export const CATEGORIES: Record<Categorie, string> = { guide: "Guide", modele: "Modèle", formation: "Formation", rapport: "Rapport" };
export const FORMATS: Record<Format, string> = { pdf: "PDF", docx: "DOCX", video: "Vidéo", photo: "Photo", page: "Page" };
export const PRIX_DEFAUT = 50000;
export const DEVISE = "Ar";

export function prixLisible(prix: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(prix).replace(/ | /g, " ")} ${DEVISE}`;
}

export function dateCourte(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(date));
}

export function estCategorie(v: unknown): v is Categorie {
  return typeof v === "string" && v in CATEGORIES;
}

export function actionLecture(format: Format): string {
  return format === "video" ? "Regarder" : "Lire";
}
