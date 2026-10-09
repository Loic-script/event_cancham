import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "@/components/app/Avatar";
import { Countdown } from "@/components/app/Countdown";
import { ChevronRightIcon, LockIcon, QrIcon } from "@/components/app/icons";
import { FollowUs, NewMembers } from "@/components/app/RightPanel";
import styles from "@/components/app/app.module.css";
import chStyles from "@/components/challenges/challenges.module.css";
import { StoriesRail } from "@/components/stories/StoriesRail";
import type { StoryView } from "@/components/stories/types";
import { QrCode } from "@/components/ticket/QrCode";
import { relativeFromMinutes } from "@/lib/format";
import { challengeBySlug, challenges, challengeStatus } from "@/lib/mock/challenges";
import { conversations, currentUser, event, fullName, participants, personById, posts, unreadTotal } from "@/lib/mock/data";
import { stories } from "@/lib/mock/stories";

export const metadata: Metadata = { title: "Accueil" };

export const dynamic = "force-dynamic";

function Section({ title, href, linkLabel, children, index }: { title: string; href: string; linkLabel: string; children: ReactNode; index: number }) {
  return (
    <section style={{ "--i": index } as React.CSSProperties}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-[1.45rem] leading-none tracking-tight text-graphite">{title}</h2>
        <Link href={href} className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-palm-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline">
          {linkLabel}
          <ChevronRightIcon width={15} height={15} />
        </Link>
      </div>
      {children}
    </section>
  );
}

const shortDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "Indian/Antananarivo" });

const GLOW = {
  leaf: "rgba(173, 7, 7, 0.38)",
  palm: "rgba(0, 113, 64, 0.38)",
  gold: "rgba(22, 50, 84, 0.3)",
} as const;

export default function HomePage() {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour >= 18 || hour < 5 ? "Bonsoir" : "Bonjour";
  const unread = unreadTotal();
  const latest = posts.slice(0, 3).map((p) => ({ ...p, author: personById(p.authorId), when: relativeFromMinutes(p.minutesAgo) }));
  const third = challenges[2];

  const storyViews: StoryView[] = stories.map((s) => {
    const author = personById(s.authorId);
    const c = challengeBySlug(s.challenge)!;
    return {
      id: s.id,
      author: { firstName: author.firstName, lastName: author.lastName, hue: author.hue, online: author.online },
      authorName: fullName(author),
      challenge: { slug: c.slug, number: c.number, title: c.title, theme: c.theme },
      when: relativeFromMinutes(s.minutesAgo),
      caption: s.caption,
      image: s.image,
    };
  });

  const online = participants.filter((p) => p.online);
  const latestConversation = [...conversations].sort(
    (a, b) => a.messages[a.messages.length - 1].minutesAgo - b.messages[b.messages.length - 1].minutesAgo,
  )[0];
  const popular: { href: string; visual: ReactNode; title: string; text: string; tone: keyof typeof GLOW }[] = [
    {
      href: "/billet",
      tone: "leaf",
      title: "Mon billet",
      text: `Table ${currentUser.ticket.table} · entrée gala`,
      visual: (
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-white shadow-[0_8px_20px_-8px_rgba(255,255,255,0.5)]">
          <QrCode value={currentUser.ticket.code} size={40} className="block h-10 w-10" />
        </span>
      ),
    },
    {
      href: "/communaute",
      tone: "palm",
      title: "Fil de communauté",
      text: `${online.length} en ligne · ${posts.length} publications`,
      visual: (
        <span className="flex h-12 items-center -space-x-2.5">
          {online.slice(0, 3).map((p) => (
            <Avatar key={p.id} person={p} size={34} className="ring-2 ring-elevated" />
          ))}
          <span className="grid h-[34px] w-[34px] place-items-center rounded-full bg-palm-soft text-[11px] font-bold text-palm-ink ring-2 ring-elevated">
            +{Math.max(0, online.length - 3)}
          </span>
        </span>
      ),
    },
    {
      href: `/messages/${latestConversation.id}`,
      tone: "gold",
      title: "Messages",
      text: unread > 0 ? `${unread} non lus · ${personById(latestConversation.participantId).firstName}` : "Tout est lu",
      visual: (
        <span className="relative inline-grid h-12 w-12 place-items-center">
          <Avatar person={personById(latestConversation.participantId)} size={44} presence />
          {unread > 0 ? <span className="absolute -right-1 -top-1 rounded-full bg-leaf px-1.5 text-[10px] font-bold text-white ring-2 ring-elevated">{unread}</span> : null}
        </span>
      ),
    },
    {
      href: `/decouvrir/${third.slug}`,
      tone: "palm",
      title: third.title,
      text: challengeStatus(third).label,
      visual: (
        <span className="relative inline-block">
          <span className={`${chStyles.miniCover} ${chStyles[third.theme]} h-12 w-12 text-[1.35rem]`}>{third.number}</span>
          <span className="absolute -bottom-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-elevated text-graphite-muted ring-1 ring-line">
            <LockIcon width={11} height={11} />
          </span>
        </span>
      ),
    },
  ];

  return (
    <div className={`${styles.stagger} flex flex-col gap-7`}>
      <section className={`${styles.hero} p-6 lg:p-9`} style={{ "--i": 0 } as React.CSSProperties} aria-labelledby="hero-title">
        <span className={styles.heroBlob} style={{ width: 260, height: 260, right: -60, top: -80, background: "rgba(0, 113, 64, 0.32)" }} aria-hidden />
        <span className={styles.heroBlob} style={{ width: 300, height: 300, left: -90, bottom: -140, background: "rgba(173, 7, 7, 0.28)", animationDelay: "-4s" }} aria-hidden />
        <span className={styles.heroRing} style={{ width: 420, height: 420, right: -120, top: -200 }} aria-hidden />
        <span className={styles.heroRing} style={{ width: 620, height: 620, right: -220, top: -300 }} aria-hidden />

        <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-graphite-muted">
              {greeting}, {currentUser.firstName} · {event.edition}
            </p>
            <h2 id="hero-title" className="mt-2 max-w-xl font-display text-[2.1rem] leading-[1.02] text-graphite lg:text-[2.9rem]">
              Trouvez votre réseau à <em className="italic text-leaf-ink">{event.name}</em>
            </h2>
            <p className="mt-3 max-w-lg text-[15px] leading-6 text-graphite-muted">
              Votre billet, trois défis à relever et des participants venus de Madagascar et du Canada à rencontrer, le {event.dateLabel.toLowerCase().replace("vendredi ", "")} au {event.venue}.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link href="/billet" className="inline-flex h-11 items-center gap-2 rounded-xl bg-leaf px-4 text-[14px] font-semibold text-white shadow-[0_12px_30px_-12px_rgba(214,47,58,0.8)] transition-[transform,background-color] active:scale-[0.98] hover:bg-[#8f0606] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2">
                <QrIcon width={17} height={17} />
                Mon billet
              </Link>
              <Link href="/communaute" className={`${styles.glass} inline-flex h-11 items-center gap-2 rounded-xl px-4 text-[14px] font-semibold text-graphite transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm`}>
                Explorer le fil
                <ChevronRightIcon width={16} height={16} />
              </Link>
            </div>
          </div>

          <Countdown
            target={event.date}
            initialRemaining={Math.floor((new Date(event.date).getTime() - now.getTime()) / 1000)}
            caption={`${shortDate.format(new Date(event.date))} · ${event.timeLabel} · ${event.venue}`}
            className="lg:min-w-[300px]"
          />
        </div>
      </section>

      <Section title="Stories des défis" href="/defis" linkLabel="Tous les défis" index={1}>
        <StoriesRail stories={storyViews} />
      </Section>

      <Section title="Populaire en ce moment" href="/communaute" linkLabel="Voir tout" index={2}>
        <div className={styles.popular}>
          {popular.map((item) => (
            <Link key={item.href} href={item.href} className={`${styles.card} ${styles.pressable} flex w-[196px] flex-col gap-3 overflow-hidden p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm-ink lg:w-auto`}>
              <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl" style={{ background: GLOW[item.tone] }} />
              <span className="relative">{item.visual}</span>
              <span className="relative">
                <span className="block truncate text-[14.5px] font-semibold text-graphite">{item.title}</span>
                <span className="block truncate text-[12.5px] text-graphite-muted">{item.text}</span>
              </span>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Derniers échos" href="/communaute" linkLabel="Voir le fil" index={3}>
        <ul className={`${styles.card} divide-y divide-line`}>
          {latest.map((p) => (
            <li key={p.id} className="flex gap-3 px-4 py-3">
              <Avatar person={p.author} size={38} presence />
              <div className="min-w-0">
                <p className="text-[13px] text-graphite-muted"><span className="font-semibold text-graphite">{fullName(p.author)}</span> · {p.when}</p>
                <p className="line-clamp-2 text-[14px] leading-5 text-graphite">{p.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <div className="grid gap-6 md:grid-cols-2 xl:hidden" style={{ "--i": 4 } as React.CSSProperties}>
        <NewMembers />
        <FollowUs />
      </div>
    </div>
  );
}
