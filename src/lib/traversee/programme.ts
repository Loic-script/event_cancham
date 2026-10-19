import type { ProgCat } from "./data";

/** Rendez-vous du programme vu par un participant : `inscrit` vaut pour le compte connecté. */
export type RendezVous = {
  id: string;
  titre: string;
  categorie: ProgCat;
  heure: string;
  lieu: string;
  /** 0 = accès libre, sans limite de places. */
  places: number;
  resume: string;
  details: string;
  image: string;
  inscrits: number;
  inscrit: boolean;
};

export type InscritProgramme = { id: number; nom: string; entreprise: string; email: string };
export type RendezVousAdmin = RendezVous & { liste: InscritProgramme[] };

export const restantes = (r: { places: number; inscrits: number }) => (r.places ? Math.max(0, r.places - r.inscrits) : null);

/** Le gala est mis en avant dans la frise. */
export const estPhare = (r: { categorie: string }) => r.categorie === "Gala";
