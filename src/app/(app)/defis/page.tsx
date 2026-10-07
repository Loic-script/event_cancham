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

      <p style={{ "--i": 0 } as React.CSSProperties} className="flex items-center gap-2 rounded-2xl bg-gold-soft px-4 py-3 text-[13.5px] font-medium text-gold lg:hidden">
        <GiftIcon width={18} height={18} className="shrink-0" />
        Deux fois 5 000 000 Ar et une MECC tout inclus à gagner.
      </p>

      {challenges.map((c, i) => {
        const status = challengeStatus(c);
        return (
          <Link key={c.slug} href={`/defis/${c.slug}`} className={styles.card} style={{ "--i": i + 1 } as React.CSSProperties} aria-label={`Défi ${c.number} : ${c.title}`}>
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
