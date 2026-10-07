import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/app/Avatar";
import {
  BellIcon,
  BriefcaseIcon,
  ChevronRightIcon,
  LinkIcon,
  LogOutIcon,
  MapPinIcon,
  PencilIcon,
  QrIcon,
  ShieldCheckIcon,
  SlidersIcon,
  TrophyIcon,
} from "@/components/app/icons";
import { PageTitle } from "@/components/app/PageTitle";
import appStyles from "@/components/app/app.module.css";
import { MyChallenges, ParticipationCount } from "@/components/challenges/MyChallenges";
import { PostCard, type FeedPost } from "@/components/feed/PostCard";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { relativeFromMinutes } from "@/lib/format";
import { countryLabel, currentUser, event, fullName, posts } from "@/lib/mock/data";

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

  const stats = [
    { label: "Défis", value: <ParticipationCount /> },
    { label: "Publications", value: String(myPosts.length) },
    { label: "Connexions", value: "18" },
  ];

  const settings = [
    { icon: BellIcon, label: "Notifications", hint: "Défis, messages, annonces" },
    { icon: SlidersIcon, label: "Préférences", hint: "Langue, affichage" },
    { icon: ShieldCheckIcon, label: "Confidentialité", hint: "Visibilité de votre profil" },
  ];

  return (
    <div className={`${appStyles.stagger} mx-auto flex max-w-2xl flex-col gap-4`}>
      <PageTitle title="Profil" />

      {/* ---------- carte d'identité ---------- */}
      <section className={`${appStyles.card} overflow-hidden`} style={{ "--i": 0 } as React.CSSProperties}>
        <div className="relative h-28 bg-gradient-to-br from-palm via-palm-deep to-[#06351f]">
          <span aria-hidden className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-leaf/35 blur-2xl" />
          <span aria-hidden className="absolute bottom-3 left-5 font-display text-[3.4rem] italic leading-none text-white/10">10 ans</span>
        </div>
        <div className="px-5 pb-5">
          <div className="-mt-12 flex items-end justify-between gap-3">
            <Avatar person={me} size={96} className="ring-4 ring-elevated" />
            <div className="flex gap-2 pb-1">
              <Link href="/billet" aria-label="Mon billet" className="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-graphite hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm">
                <QrIcon width={19} height={19} />
              </Link>
              <button type="button" className="flex h-10 cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-4 text-[13px] font-semibold text-graphite hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm">
                <PencilIcon width={16} height={16} />
                Modifier
              </button>
            </div>
          </div>
          <h2 className="mt-3 font-display text-[1.9rem] leading-none tracking-tight text-graphite">{fullName(me)}</h2>
          <p className="mt-1.5 text-[14.5px] text-graphite-muted">{me.role} · {me.company}</p>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-graphite-muted">
            <span className="flex items-center gap-1"><MapPinIcon width={14} height={14} />{me.city}, {countryLabel[me.country]}</span>
            <span className="flex items-center gap-1"><BriefcaseIcon width={14} height={14} />{me.sector}</span>
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1 text-[12px] font-semibold text-gold">
            <TrophyIcon width={14} height={14} />
            Participant · {event.edition}
          </p>
        </div>
      </section>

      {/* ---------- chiffres ---------- */}
      <ul className="grid grid-cols-3 gap-2" style={{ "--i": 1 } as React.CSSProperties}>
        {stats.map((s) => (
          <li key={s.label} className={`${appStyles.card} flex flex-col items-center gap-0.5 px-1 py-3 text-center`}>
            <span className="font-display text-[1.45rem] leading-none text-graphite">{s.value}</span>
            <span className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-graphite-faint">{s.label}</span>
          </li>
        ))}
      </ul>

      {/* ---------- onglets ---------- */}
      <section className={`${appStyles.card} px-4 pb-4`} style={{ "--i": 2 } as React.CSSProperties}>
        <ProfileTabs
          counts={{ challenges: <ParticipationCount />, posts: myPosts.length }}
          about={
            <dl className="flex flex-col gap-4 text-[14.5px]">
              <div>
                <dt className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-graphite-faint">Bio</dt>
                <dd className="mt-1 leading-6 text-graphite">{me.bio}</dd>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-graphite-faint">E-mail</dt>
                  <dd className="mt-1 truncate text-graphite">{me.email}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-graphite-faint">LinkedIn</dt>
                  <dd className="mt-1 truncate">
                    <a href={`https://${me.linkedin}`} className="inline-flex items-center gap-1 text-palm-ink underline-offset-4 hover:underline"><LinkIcon width={14} height={14} />{me.linkedin}</a>
                  </dd>
                </div>
              </div>
            </dl>
          }
          challenges={<MyChallenges />}
          posts={
            myPosts.length ? (
              <div className="flex flex-col gap-3">
                {myPosts.map((p) => <PostCard key={p.id} post={p} />)}
              </div>
            ) : (
              <p className="py-6 text-center text-[14px] text-graphite-muted">Vous n’avez encore rien publié.</p>
            )
          }
        />
      </section>

      {/* ---------- réglages ---------- */}
      <section className={`${appStyles.card} divide-y divide-line`} style={{ "--i": 3 } as React.CSSProperties}>
        {settings.map((s) => (
          <button key={s.label} type="button" className="flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-palm">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-paper text-graphite-muted"><s.icon width={18} height={18} /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14.5px] font-semibold text-graphite">{s.label}</span>
              <span className="block text-[12.5px] text-graphite-muted">{s.hint}</span>
            </span>
            <ChevronRightIcon width={18} height={18} className="text-graphite-faint" />
          </button>
        ))}
        <button type="button" className="flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left text-leaf-ink hover:bg-leaf-soft/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-leaf">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-leaf-soft"><LogOutIcon width={18} height={18} /></span>
          <span className="text-[14.5px] font-semibold">Se déconnecter</span>
        </button>
      </section>
    </div>
  );
}
