export type Categorie = "guide" | "modele" | "formation" | "rapport";
export type Format = "pdf" | "docx" | "video" | "photo" | "page";

export const CATEGORIES: Record<Categorie, string> = { guide: "Guide", modele: "Modèle", formation: "Formation", rapport: "Rapport" };
export const CATEGORIES_PLURIEL: Record<Categorie, string> = { guide: "Guides", modele: "Modèles", formation: "Formations", rapport: "Rapports" };
export const FORMATS: Record<Format, string> = { pdf: "PDF", docx: "DOCX", video: "Vidéo", photo: "Photo", page: "Page" };

export function dateCourte(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(date));
}

export function estCategorie(v: unknown): v is Categorie {
  return typeof v === "string" && v in CATEGORIES;
}

export function actionLecture(format: Format): string {
  return format === "video" ? "Regarder" : "Lire";
}
