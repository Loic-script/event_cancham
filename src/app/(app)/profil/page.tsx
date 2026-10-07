import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRightIcon, TrophyIcon } from "@/components/app/icons";
import { PageTitle } from "@/components/app/PageTitle";
import appStyles from "@/components/app/app.module.css";
import { MyChallenges } from "@/components/challenges/MyChallenges";
import { PostCard, type FeedPost } from "@/components/feed/PostCard";
import { ProfileSettings } from "@/components/profile/ProfileSettings";
import { relativeFromMinutes } from "@/lib/format";
import { currentUser, fullName, posts } from "@/lib/mock/data";

export const metadata: Metadata = { title: "Profil" };

export default function ProfilePage() {
  const me = currentUser;
  const myPosts: FeedPost[] = posts
    .filter((p) => p.authorId === me.id)
    .map((p) => ({
      id: p.id,
      author: { firstName: me.firstName, lastName: me.lastName, hue: me.hue, online: true, role: me.role, company: me.company },
      authorName: fullName(me),
      when: relativeFromMinutes(p.minutesAgo),
      text: p.text,
      likes: p.likes,
      comments: p.comments,
      liked: p.liked,
      tag: p.tag,
      challenge: p.challenge,
    }));

  const extra = (
    <>
      <section className={`${appStyles.card} p-4`} aria-labelledby="my-challenges">
        <div className="mb-3 flex items-center justify-between">
          <h3 id="my-challenges" className="flex items-center gap-2 text-[15px] font-semibold text-graphite">
            <TrophyIcon width={18} height={18} className="text-gold" />
            Mes défis
          </h3>
          <Link href="/defis" className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-palm-ink underline-offset-4 hover:underline">
            Tous les défis
            <ChevronRightIcon width={15} height={15} />
          </Link>
        </div>
        <MyChallenges />
      </section>

      <section aria-labelledby="my-posts">
        <h3 id="my-posts" className="mb-3 px-1 text-[13px] font-semibold uppercase tracking-[0.12em] text-graphite-muted">
          Mes publications · {myPosts.length}
        </h3>
        <div className="flex flex-col gap-3">
          {myPosts.length ? myPosts.map((p) => <PostCard key={p.id} post={p} />) : <p className={`${appStyles.card} p-6 text-center text-[14px] text-graphite-muted`}>Vous n’avez encore rien publié.</p>}
        </div>
      </section>
    </>
  );

  return (
    <>
      <PageTitle title="Profil" subtitle="Vos informations, telles que les autres participants les voient." />
      <ProfileSettings extra={extra} />
    </>
  );
}
