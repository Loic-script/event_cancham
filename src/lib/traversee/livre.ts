/** Livre d'or vidéo tel que les composants le reçoivent (données en base, voir src/lib/livre.ts). */
export type EtatSouvenir = "attente" | "valide" | "refuse";

export type SouvenirVue = { id: string; video: string; duree: string; nom: string; ent: string; texte: string; etat: EtatSouvenir; t: number };

export const MAX_TEXTE_SOUVENIR = 500;

export const formatDuree = (s: number | null) => (s === null ? "" : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`);
