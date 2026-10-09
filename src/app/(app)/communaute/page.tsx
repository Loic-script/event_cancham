import type { Metadata } from "next";
import { PageTitle } from "@/components/app/PageTitle";
import { Feed, type FeedPerson } from "@/components/feed/Feed";
import type { FeedPost } from "@/components/feed/PostCard";
import { relativeFromMinutes } from "@/lib/format";
import { conversations, currentUser, fullName, participants, personById, posts } from "@/lib/mock/data";

export const metadata: Metadata = { title: "Fil de communauté" };

export default async function CommunityPage(props: PageProps<"/communaute">) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const initialTab = q || sp.tab === "people" ? "people" : "posts";

  const feedPosts: FeedPost[] = posts.map((p) => {
    const author = personById(p.authorId);
    return {
      id: p.id,
      author: { firstName: author.firstName, lastName: author.lastName, hue: author.hue, online: author.online, role: author.role, company: author.company },
      authorName: fullName(author),
      when: relativeFromMinutes(p.minutesAgo),
      text: p.text,
      likes: p.likes,
      comments: p.comments,
      liked: p.liked,
      tag: p.tag,
      challenge: p.challenge,
    };
  });

  const people: FeedPerson[] = participants.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    name: fullName(p),
    role: p.role,
    company: p.company,
    city: p.city,
    country: p.country,
    sector: p.sector,
    hue: p.hue,
    online: p.online,
    conversationId: conversations.find((c) => c.participantId === p.id)?.id,
  }));

  return (
    <>
      <PageTitle title="Fil de communauté" subtitle="Les participants, leurs publications et les défis relevés ce soir." />
      <Feed
        me={{ firstName: currentUser.firstName, lastName: currentUser.lastName, name: fullName(currentUser), hue: currentUser.hue, role: currentUser.role, company: currentUser.company }}
        posts={feedPosts}
        people={people}
        initialQuery={q}
        initialTab={initialTab}
      />
    </>
  );
}
