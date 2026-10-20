/** Galerie, stories et promotions telles que les composants les reçoivent (données en base, voir src/lib/galerie.ts). */

export type PhotoVue = { id: string; src: string; officielle: boolean; auteur: string; aMoi: boolean; t: number };

/** Story de l'accueil : story créée par la CanCham (`story`) ou photo de la galerie (`photo`). */
export type StoryVue = { id: string; img: string; texte: string; auteur: "CanCham" | "Participant"; story?: string; photo?: string };

export type Promo = { ann: string; titre: string; texte: string; img: string; lien: string };

/** Emplacements promotion de l'accueil (null : emplacement libre). */
export const NB_PROMOTIONS = 4;
