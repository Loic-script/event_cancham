import type { ChallengeSlug } from "./challenges";

// Stories des défis : la photo publiée par un participant pour un défi.
// `image` (chemin dans /public) est facultatif ; sans photo, une composition
// aux couleurs du défi et du participant est dessinée.

export type Story = {
  id: string;
  authorId: string;
  challenge: ChallengeSlug;
  minutesAgo: number;
  caption?: string;
  image?: string;
};

export const stories: Story[] = [
  { id: "s1", authorId: "p5", challenge: "jy-serai", minutesAgo: 18, caption: "J'y serai, et je viens avec toute l'équipe Tsiky Tech !" },
  { id: "s2", authorId: "p1", challenge: "jy-serai", minutesAgo: 42, caption: "Vanille, girofle… et un billet pour le gala des 10 ans." },
  { id: "s3", authorId: "p7", challenge: "pitch-mecc", minutesAgo: 65, caption: "Deux minutes pour raconter Zafy Design. Vidéo déposée." },
  { id: "s4", authorId: "p3", challenge: "jy-serai", minutesAgo: 120, caption: "Montréal → Antananarivo. J'y serai le 18 décembre." },
  { id: "s5", authorId: "p10", challenge: "jy-serai", minutesAgo: 190, caption: "Reportage en préparation, rendez-vous près de la scène." },
  { id: "s6", authorId: "p4", challenge: "jy-serai", minutesAgo: 260, caption: "Première fois à Madagascar, et déjà au gala." },
  { id: "s7", authorId: "p8", challenge: "pitch-mecc", minutesAgo: 400, caption: "Jury du pitch : j'ai hâte de voir vos projets." },
  { id: "s8", authorId: "p9", challenge: "jy-serai", minutesAgo: 540, caption: "Toamasina représente ! On se retrouve table 7." },
];
