import type { Fiche } from "./store";

/** Fiche d'un participant inscrit (annuaire et back-office), construite depuis la base par src/lib/annuaire.ts ; img : adresse de la bannière (couverture ou photo de l'événement). */
/** `couvertureDefaut` : pas de photo de couverture, la fiche affiche le logo IMPACT 261 sur fond bleu nuit. */
export type FicheComplete = Fiche & { id: string; img: string; imgPosition: number; couvertureDefaut?: boolean; code: string; photo?: string | null };
