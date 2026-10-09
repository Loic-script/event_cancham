import type { ChallengeSlug, ChallengeTheme } from "@/lib/mock/challenges";

export type StoryView = {
  id: string;
  author: { firstName: string; lastName: string; hue: number; online?: boolean };
  authorName: string;
  challenge: { slug: ChallengeSlug; number: number; title: string; theme: ChallengeTheme };
  when: string;
  caption?: string;
  image?: string;
};
