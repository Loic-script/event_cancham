import type { Fiche } from "./store";

/** Fiche d'un participant inscrit (annuaire et back-office), construite depuis la base par src/lib/annuaire.ts. */
export type FicheComplete = Fiche & { id: string; img: string; code: string; photo?: string | null };
