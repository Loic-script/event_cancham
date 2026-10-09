import type { Metadata } from "next";
import { PageTitle } from "@/components/app/PageTitle";
import { SocialFeed, type SocialPostView } from "@/components/social/SocialFeed";
import { relativeFromMinutes } from "@/lib/format";
import { challengeBySlug } from "@/lib/mock/challenges";
import { fullName, personById } from "@/lib/mock/data";
import { socialPosts } from "@/lib/mock/social";

export const metadata: Metadata = { title: "Réseaux sociaux" };

export default function SocialPage() {
  const posts: SocialPostView[] = [...socialPosts]
    .sort((a, b) => a.minutesAgo - b.minutesAgo)
    .map((p) => {
      const author = personById(p.authorId);
      const c = challengeBySlug(p.challenge)!;
      return {
        id: p.id,
        network: p.network,
        url: p.url,
        caption: p.caption,
        image: p.image,
        reactions: p.reactions,
        comments: p.comments,
        shares: p.shares,
        when: relativeFromMinutes(p.minutesAgo),
        author: { firstName: author.firstName, lastName: author.lastName, hue: author.hue, online: author.online, company: author.company, role: author.role },
        authorName: fullName(author),
        challenge: { slug: c.slug, number: c.number, title: c.title, theme: c.theme },
      };
    });

  return (
    <>
      <PageTitle title="Réseaux sociaux" subtitle="Les publications des participants pour les défis, relevées sur Facebook et Instagram." />
      <SocialFeed posts={posts} />
    </>
  );
}
