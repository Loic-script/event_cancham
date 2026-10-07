import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "@/components/app/Avatar";
import { CalendarIcon, ChevronRightIcon, LockIcon, MapPinIcon, QrIcon, UsersIcon } from "@/components/app/icons";
import { FollowUs, NewMembers } from "@/components/app/RightPanel";
import styles from "@/components/app/app.module.css";
import { ChallengeCover } from "@/components/challenges/ChallengeCover";
import { StatusChip } from "@/components/challenges/StatusChip";
import chStyles from "@/components/challenges/challenges.module.css";
import { QrCode } from "@/components/ticket/QrCode";
import { daysUntil, relativeFromMinutes } from "@/lib/format";
import { challenges, challengeStatus } from "@/lib/mock/challenges";
import { conversations, currentUser, event, fullName, participants, personById, posts, unreadTotal } from "@/lib/mock/data";

export const metadata: Metadata = { title: "Accueil" };

// Le compte à rebours dépend de la date du jour : page rendue à chaque requête.
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

// Halo coloré dans l'angle des cartes « Populaire en ce moment ».
const GLOW = {
  leaf: "rgba(214, 47, 58, 0.38)",
  palm: "rgba(15, 138, 75, 0.38)",
  gold: "rgba(227, 184, 90, 0.3)",
} as const;

export default function HomePage() {
  const hour = new Date().getHours();
  const greeting = hour >= 18 || hour < 5 ? "Bonsoir" : "Bonjour";
  const days = daysUntil(event.date);
  const unread = unreadTotal();
  const latest = posts.slice(0, 3).map((p) => ({ ...p, author: personById(p.authorId), when: relativeFromMinutes(p.minutesAgo) }));
  const featured = challenges.slice(0, 2);
  const third = challenges[2];

  // Visuels contextuels plutôt que des icônes : le vrai QR code, les
  // participants en ligne, le dernier interlocuteur, la couverture du défi.
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
      href: `/defis/${third.slug}`,
      tone: "palm",
      title: third.title,
      text: challengeStatus(third).label,
      visual: (
        <span className="relative inline-block">
          <span
            className={`${chStyles.art} ${chStyles[third.theme]} grid h-12 w-12 place-items-center rounded-xl font-display text-[1.35rem] italic text-white`}
            style={{ position: "relative", inset: "auto" }}
          >
            {third.number}
          </span>
          <span className="absolute -bottom-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-elevated text-graphite-muted ring-1 ring-line">
            <LockIcon width={11} height={11} />
          </span>
        </span>
      ),
    },
  ];

  return (
    <div className={`${styles.stagger} flex flex-col gap-7`}>
      {/* ---------- bannière ---------- */}
      <section className={`${styles.hero} p-6 lg:p-9`} style={{ "--i": 0 } as React.CSSProperties} aria-labelledby="hero-title">
        <span className={styles.heroBlob} style={{ width: 260, height: 260, right: -60, top: -80, background: "rgba(15, 138, 75, 0.55)" }} aria-hidden />
        <span className={styles.heroBlob} style={{ width: 300, height: 300, left: -90, bottom: -140, background: "rgba(214, 47, 58, 0.5)", animationDelay: "-4s" }} aria-hidden />
        <span className={styles.heroRing} style={{ width: 420, height: 420, right: -120, top: -200 }} aria-hidden />
        <span className={styles.heroRing} style={{ width: 620, height: 620, right: -220, top: -300 }} aria-hidden />

        <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/65">
              {greeting}, {currentUser.firstName} · {event.edition}
            </p>
            <h2 id="hero-title" className="mt-2 max-w-xl font-display text-[2.1rem] leading-[1.02] text-white lg:text-[2.9rem]">
              Trouvez votre réseau à <em className="italic text-leaf-ink">{event.name}</em>
            </h2>
            <p className="mt-3 max-w-lg text-[15px] leading-6 text-white/75">
              Votre billet, trois défis à relever et des participants venus de Madagascar et du Canada à rencontrer, le {event.dateLabel.toLowerCase().replace("vendredi ", "")} au {event.venue}.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link href="/billet" className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-[14px] font-semibold text-[#152019] shadow-[0_12px_30px_-12px_rgba(255,255,255,0.6)] transition-transform active:scale-[0.98] hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
                <QrIcon width={17} height={17} />
                Mon billet
              </Link>
              <Link href="/communaute" className={`${styles.glass} inline-flex h-11 items-center gap-2 rounded-xl px-4 text-[14px] font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70`}>
                Explorer le fil
                <ChevronRightIcon width={16} height={16} />
              </Link>
            </div>
          </div>

          <div className={`${styles.glass} min-w-[200px] rounded-2xl px-5 py-4 text-center`}>
            <p className="font-display text-[3.1rem] leading-none text-white">J-{days}</p>
            <p className="mt-0.5 text-[10.5px] uppercase tracking-[0.18em] text-white/60">avant le gala</p>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[12.5px] text-white/80"><CalendarIcon width={14} height={14} />{event.dateLabel} · {event.timeLabel}</p>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-[12.5px] text-white/80"><MapPinIcon width={14} height={14} />{event.venue}, {event.city}</p>
          </div>
        </div>
      </section>

      {/* ---------- à la une ---------- */}
      <Section title="À la une" href="/defis" linkLabel="Tous les défis" index={1}>
        <div className="grid gap-4 sm:grid-cols-2">
          {featured.map((c) => (
            <Link key={c.slug} href={`/defis/${c.slug}`} className={chStyles.card} aria-label={`Défi ${c.number} : ${c.title}`}>
              <ChallengeCover challenge={c}>
                <div className="absolute right-3 top-3">
                  <StatusChip status={challengeStatus(c)} />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-white/80">Défi {c.number} · {c.phase}</p>
                  <h3 className="mt-1 line-clamp-2 font-display text-[1.45rem] leading-[1.05] text-white">{c.title}</h3>
                </div>
              </ChallengeCover>
              <div className="p-4">
                <p className="text-[13.5px] leading-5 text-graphite-muted">{c.summary}</p>
                <p className="mt-2 flex items-center justify-between text-[12.5px]">
                  <span className="font-semibold text-palm-ink">{c.prize}</span>
                  {c.participants > 0 ? (
                    <span className="inline-flex items-center gap-1 text-graphite-faint"><UsersIcon width={13} height={13} />{c.participants} participations</span>
                  ) : null}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* ---------- populaire en ce moment ---------- */}
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

      {/* ---------- derniers échos ---------- */}
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

      {/* sur écran étroit, le panneau de droite s'affiche ici */}
      <div className="grid gap-6 md:grid-cols-2 xl:hidden" style={{ "--i": 4 } as React.CSSProperties}>
        <NewMembers />
        <FollowUs />
      </div>
    </div>
  );
}
