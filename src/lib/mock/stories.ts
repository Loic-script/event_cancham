import type { ChallengeSlug } from "./challenges";

export type Story = {
  id: string;
  authorId: string;
  challenge: ChallengeSlug;
  minutesAgo: number;
  caption?: string;
  image?: string;
  post?: string;
};

export const stories: Story[] = [
  { id: "s1", authorId: "p5", challenge: "jy-serai", minutesAgo: 18, caption: "J'y serai, et je viens avec toute l'équipe Tsiky Tech !", image: "/stories/story-1.jpg", post: "n1" },
  { id: "s2", authorId: "p1", challenge: "jy-serai", minutesAgo: 42, caption: "Vanille, girofle… et un billet pour le gala des 10 ans.", image: "/stories/story-6.jpg", post: "n2" },
  { id: "s3", authorId: "p7", challenge: "pitch-mecc", minutesAgo: 65, caption: "Deux minutes pour raconter Zafy Design. Vidéo déposée.", post: "n8" },
  { id: "s4", authorId: "p3", challenge: "jy-serai", minutesAgo: 120, caption: "Montréal → Antananarivo. J'y serai le 18 décembre.", image: "/stories/story-4.jpg", post: "n3" },
  { id: "s5", authorId: "p10", challenge: "jy-serai", minutesAgo: 190, caption: "Reportage en préparation, rendez-vous près de la scène.", image: "/stories/story-3.jpg", post: "n4" },
  { id: "s6", authorId: "p4", challenge: "jy-serai", minutesAgo: 260, caption: "Première fois à Madagascar, et déjà au gala.", image: "/stories/story-2.jpg", post: "n5" },
  { id: "s7", authorId: "p8", challenge: "pitch-mecc", minutesAgo: 400, caption: "Jury du pitch : j'ai hâte de voir vos projets.", image: "/stories/story-5.jpg", post: "n7" },
  { id: "s8", authorId: "p9", challenge: "jy-serai", minutesAgo: 540, caption: "Toamasina représente ! On se retrouve table 7.", image: "/stories/story-7.jpg", post: "n6" },
];
