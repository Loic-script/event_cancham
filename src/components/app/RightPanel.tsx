import Link from "next/link";
import { relativeFromMinutes } from "@/lib/format";
import { challenges } from "@/lib/mock/challenges";
import { currentUser, fullName, participants, posts } from "@/lib/mock/data";
import { QrCode } from "@/components/ticket/QrCode";
import { Avatar } from "./Avatar";
import { FacebookLogo, InstagramLogo, LinkedinLogo } from "./BrandLogos";
import { ChevronRightIcon, MaximizeIcon } from "./icons";
import styles from "./app.module.css";

const NEW_MEMBERS: { id: string; minutesAgo: number }[] = [
  { id: "p10", minutesAgo: 6 },
  { id: "p8", minutesAgo: 31 },
  { id: "p4", minutesAgo: 75 },
  { id: "p6", minutesAgo: 190 },
];

const SOCIAL = [
  { label: "Facebook", handle: "@canchammadagascar", href: "https://www.facebook.com/canchammadagascar", logo: FacebookLogo },
  { label: "Instagram", handle: "@cancham.mg", href: "https://www.instagram.com/cancham.mg", logo: InstagramLogo },
  { label: "LinkedIn", handle: "CanCham Madagascar", href: "https://www.linkedin.com/company/cancham-madagascar", logo: LinkedinLogo },
];

export function ProfileCard() {
  const me = currentUser;
  const myPosts = posts.filter((p) => p.authorId === me.id).length;
  return (
    <section className={`${styles.card} flex flex-col items-center px-4 pb-4 pt-4 text-center`} aria-label="Mon billet">
      <dl className="grid w-full grid-cols-3 gap-1">
        {[
          { label: "Défis", value: challenges.length },
          { label: "Posts", value: myPosts },
          { label: "Table", value: me.ticket.table },
        ].map((s) => (
          <div key={s.label}>
            <dt className="text-[10px] uppercase tracking-[0.12em] text-graphite-faint">{s.label}</dt>
            <dd className="font-display text-[1.2rem] leading-tight text-graphite">{s.value}</dd>
          </div>
        ))}
      </dl>
      <Link
        href="/billet"
        aria-label={`Mon billet, code ${me.ticket.code}, table ${me.ticket.table}. Ouvrir le billet en grand.`}
        className={`${styles.pressable} group mt-3 block w-full rounded-2xl border border-line bg-white p-3 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm`}
      >
        <QrCode value={me.ticket.code} size={150} className="mx-auto block h-[150px] w-[150px]" />
        <p className="mt-2 font-mono text-[12px] tracking-[0.16em] text-graphite">{me.ticket.code}</p>
        <p className="mt-1 inline-flex items-center justify-center gap-1.5 text-[11.5px] text-graphite-muted">
          <MaximizeIcon width={13} height={13} className="text-palm-ink" />
          Billet d’entrée · table {me.ticket.table} · toucher pour agrandir
        </p>
      </Link>
    </section>
  );
}

export function NewMembers({ compact = false }: { compact?: boolean }) {
  return (
    <section aria-labelledby="new-members-title">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 id="new-members-title" className="text-[13px] font-semibold uppercase tracking-[0.12em] text-graphite-muted">Nouveaux participants</h2>
        <Link href="/communaute?tab=people" className="text-[12.5px] font-semibold text-palm-ink underline-offset-4 hover:underline">Tous</Link>
      </div>
      <ul className={`${styles.card} divide-y divide-line ${compact ? "" : ""}`}>
        {NEW_MEMBERS.map(({ id, minutesAgo }) => {
          const p = participants.find((x) => x.id === id)!;
          return (
            <li key={id} className="flex items-center gap-3 px-3 py-2.5">
              <Avatar person={p} size={38} presence />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold text-graphite">{fullName(p)}</span>
                <span className="block truncate text-[11.5px] text-graphite-faint">{relativeFromMinutes(minutesAgo)} · {p.company}</span>
              </span>
              <ChevronRightIcon width={16} height={16} className="shrink-0 text-graphite-faint" />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function FollowUs() {
  return (
    <section aria-labelledby="follow-title">
      <h2 id="follow-title" className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-[0.12em] text-graphite-muted">Suivez CanCham</h2>
      <ul className="flex flex-col gap-2">
        {SOCIAL.map((s) => (
          <li key={s.label}>
            <a
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className={`${styles.card} ${styles.pressable} flex items-center gap-3 px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm-ink`}
            >
              <s.logo size={38} className="shrink-0 drop-shadow-[0_6px_14px_rgba(0,0,0,0.45)]" />
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-semibold text-graphite">{s.label}</span>
                <span className="block truncate text-[11.5px] text-graphite-faint">{s.handle}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RightPanel() {
  return (
    <div className="flex flex-col gap-6">
      <ProfileCard />
      <NewMembers />
      <FollowUs />
    </div>
  );
}
