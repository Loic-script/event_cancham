import type { ChallengeSlug } from "./challenges";

export type Network = "facebook" | "instagram";

export type SocialPost = {
  id: string;
  authorId: string;
  challenge: ChallengeSlug;
  network: Network;
  minutesAgo: number;
  caption: string;
  image?: string;
  reactions: number;
  comments: number;
  shares: number;
  url: string;
};

export const socialPosts: SocialPost[] = [
  { id: "n1", authorId: "p5", challenge: "jy-serai", network: "facebook", minutesAgo: 25, caption: "J'y serai, et toute l'équipe Tsiky Tech aussi ! Rendez-vous le 18 décembre au gala des 10 ans de @CanCham Madagascar. #LaTraversée10ans", image: "/stories/story-1.jpg", reactions: 312, comments: 41, shares: 18, url: "https://www.facebook.com/tsikytech/posts/10224871" },
  { id: "n2", authorId: "p1", challenge: "jy-serai", network: "instagram", minutesAgo: 50, caption: "Vanille, girofle… et un billet pour La Traversée. On se retrouve au gala ? @canchammadagascar #LaTraversée10ans #CanChamMadagascar", image: "/stories/story-6.jpg", reactions: 287, comments: 36, shares: 9, url: "https://www.instagram.com/p/CxSahanala2026" },
  { id: "n3", authorId: "p3", challenge: "jy-serai", network: "facebook", minutesAgo: 130, caption: "Montréal → Antananarivo. Fière de représenter le Québec au gala des 10 ans de la CanCham. J'y serai ! #LaTraversée10ans", image: "/stories/story-4.jpg", reactions: 198, comments: 22, shares: 12, url: "https://www.facebook.com/julie.tremblay/posts/7781220" },
  { id: "n4", authorId: "p10", challenge: "jy-serai", network: "instagram", minutesAgo: 190, caption: "Reportage en préparation pour Les Affaires : les entrepreneures malgaches à l'honneur. J'y serai, appareil en main. #LaTraversée10ans", image: "/stories/story-3.jpg", reactions: 154, comments: 19, shares: 4, url: "https://www.instagram.com/p/CxCamilleRoy26" },
  { id: "n5", authorId: "p4", challenge: "jy-serai", network: "facebook", minutesAgo: 260, caption: "Premier séjour à Madagascar et déjà invité au gala de La Traversée. Nordik Minerals sera là ! @CanCham Madagascar #LaTraversée10ans", image: "/stories/story-2.jpg", reactions: 121, comments: 14, shares: 7, url: "https://www.facebook.com/nordikminerals/posts/5540912" },
  { id: "n6", authorId: "p9", challenge: "jy-serai", network: "facebook", minutesAgo: 540, caption: "Toamasina représente ! Table 7 réservée pour le gala des 10 ans. #LaTraversée10ans #CanChamMadagascar", image: "/stories/story-7.jpg", reactions: 73, comments: 9, shares: 3, url: "https://www.facebook.com/nirina.rab/posts/3310877" },
  { id: "n7", authorId: "p8", challenge: "pitch-mecc", network: "instagram", minutesAgo: 1440, caption: "Côté jury cette année pour le pitch MECC. Hâte de découvrir vos projets ! @canchammadagascar #LaTraversée10ans", image: "/stories/story-5.jpg", reactions: 96, comments: 11, shares: 2, url: "https://www.instagram.com/p/CxSaintLaurent26" },
  { id: "n8", authorId: "p7", challenge: "pitch-mecc", network: "instagram", minutesAgo: 95, caption: "Deux minutes pour raconter Zafy Design, vidéo de pitch déposée pour la MECC. Croisez les doigts avec moi ! #LaTraversée10ans", reactions: 64, comments: 8, shares: 1, url: "https://www.instagram.com/p/CxZafyDesign26" },
];
