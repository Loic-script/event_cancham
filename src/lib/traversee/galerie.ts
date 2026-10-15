import { GALERIE, type Media, type Story } from "./data";
import type { TraverseeState } from "./store";

export type StoryVue = Story & { auteur: string; media?: string };

export function galerie(s: TraverseeState): Media[] {
  const ajoutees: Media[] = s.galAjoutees.map((m) => ({ id: m.id, src: m.src, video: false, par: m.par ?? "vous", moi: (m.par ?? "vous") === "vous" }));
  return [...ajoutees, ...GALERIE].filter((m) => !s.galSupprimees.includes(m.id));
}

export function toutesStories(s: TraverseeState): StoryVue[] {
  const creees: StoryVue[] = s.stories.map((st) => ({ ...st, auteur: "CanCham" }));
  const photos: StoryVue[] = galerie(s)
    .filter((m) => !m.video)
    .map((m) => ({
      id: `gal-${m.id}`,
      img: m.src,
      texte: m.par === "vous" ? "Partagée par un participant" : "La Traversée en images",
      auteur: m.par === "vous" ? "Participant" : "CanCham",
      media: m.id,
    }));
  return [...creees, ...photos];
}
