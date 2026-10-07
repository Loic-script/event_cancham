import type { ChallengeSlug, ChallengeTheme } from "@/lib/mock/challenges";

/** Story prête à l'affichage (préparée côté serveur). */
export type StoryView = {
  id: string;
  author: { firstName: string; lastName: string; hue: number; online?: boolean };
  authorName: string;
  challenge: { slug: ChallengeSlug; number: number; title: string; theme: ChallengeTheme };
  when: string;
  caption?: string;
  image?: string;
};
