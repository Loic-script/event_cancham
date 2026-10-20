import type { Fiche } from "./store";

/** Fiche d'un participant inscrit (annuaire et back-office), construite depuis la base par src/lib/annuaire.ts ; img : adresse de la bannière (couverture ou photo de l'événement). */
export type FicheComplete = Fiche & { id: string; img: string; imgPosition: number; code: string; photo?: string | null };
