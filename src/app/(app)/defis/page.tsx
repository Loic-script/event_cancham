import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRightIcon, GiftIcon, UsersIcon } from "@/components/app/icons";
import { PageTitle } from "@/components/app/PageTitle";
import appStyles from "@/components/app/app.module.css";
import { ChallengeCover } from "@/components/challenges/ChallengeCover";
import { StatusChip } from "@/components/challenges/StatusChip";
import styles from "@/components/challenges/challenges.module.css";
import { challenges, challengeStatus } from "@/lib/mock/challenges";

export const metadata: Metadata = { title: "Les défis" };

// L'état d'un défi dépend de la date : page rendue à chaque requête.
export const dynamic = "force-dynamic";

export default function ChallengesPage() {
  return (
    <div className={`${appStyles.stagger} mx-auto flex max-w-2xl flex-col gap-4 lg:grid lg:max-w-5xl lg:grid-cols-3 lg:items-start lg:gap-5`}>
      <div className="lg:col-span-3">
        <PageTitle title="Les défis" subtitle="Trois défis, deux fois 5 000 000 Ar et une mission au Canada à gagner." />
      </div>

      {/* accès à l'espace immersif « Découvrir les défis » */}
      <Link
        href="/decouvrir"
        style={{ "--i": 0 } as React.CSSProperties}
        className="group relative flex items-center gap-4 overflow-hidden rounded-2xl bg-[#0f1d2c] p-4 text-white shadow-[0_18px_40px_-24px_rgba(15,29,44,0.8)] transition-transform active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm focus-visible:ring-offset-2 lg:col-span-3 lg:p-5"
      >
        <span aria-hidden className="pointer-events-none absolute -left-10 -top-14 h-40 w-40 rounded-full bg-[#ad0707]/50 blur-2xl" />
        <span aria-hidden className="pointer-events-none absolute -right-10 -bottom-16 h-44 w-44 rounded-full bg-[#007140]/50 blur-2xl" />
        <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/20">
          <GiftIcon width={22} height={22} />
        </span>
        <span className="relative min-w-0 flex-1">
          <span className="block font-display text-[1.15rem] leading-tight lg:text-[1.35rem]">Découvrir les défis</span>
          <span className="block text-[13px] text-white/75">Un espace dédié pour choisir votre défi et suivre votre progression.</span>
        </span>
        <span className="relative inline-flex h-10 shrink-0 items-center gap-1 rounded-xl bg-[linear-gradient(90deg,#ad0707,#007140)] px-3 text-[13.5px] font-semibold transition-[filter] group-hover:brightness-110 lg:px-4">
          Ouvrir
          <ChevronRightIcon width={16} height={16} />
        </span>
      </Link>

      {challenges.map((c, i) => {
        const status = challengeStatus(c);
        return (
          <Link key={c.slug} href={`/decouvrir/${c.slug}`} className={styles.card} style={{ "--i": i + 1 } as React.CSSProperties} aria-label={`Défi ${c.number} : ${c.title}`}>
            <ChallengeCover challenge={c}>
              <div className="absolute right-3 top-3">
                <StatusChip status={status} />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-white/80">Défi {c.number} · {c.phase}</p>
                <h2 className="mt-1 line-clamp-2 font-display text-[1.55rem] leading-[1.05]">{c.title}</h2>
              </div>
            </ChallengeCover>
            <div className="flex items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-display text-[1.35rem] leading-none text-palm-ink">
                  {c.prize} {c.kind === "photo" ? <span className="font-sans text-[13px] font-normal text-graphite-muted">{c.prizeNote}</span> : null}
                </p>
                <p className="mt-1.5 text-[14px] leading-5 text-graphite-muted">{c.summary}</p>
                {c.participants > 0 ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] text-graphite-faint">
                    <UsersIcon width={14} height={14} />
                    {c.participants} participations
                  </p>
                ) : null}
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-palm-soft text-palm-ink">
                <ChevronRightIcon width={20} height={20} />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
