"use client";

import Link from "next/link";
import { ChevronRightIcon, CheckIcon, LockIcon } from "@/components/app/icons";
import { useParticipations } from "@/components/challenges/useParticipation";
import { challenges, challengeStatus } from "@/lib/mock/challenges";
import styles from "./discover.module.css";

type DiscoverProgressProps = {
  daysLeft: number;
};

export function DiscoverProgress({ daysLeft }: DiscoverProgressProps) {
  const mine = useParticipations();
  const done = challenges.filter((c) => mine[c.slug]).length;
  const percent = Math.round((done / challenges.length) * 100);
  const next = challenges.find((c) => !mine[c.slug] && challengeStatus(c).key === "open") ?? challenges.find((c) => !mine[c.slug]) ?? null;
  const nextStatus = next ? challengeStatus(next) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className={styles.tiles}>
        <div className={`${styles.glass} ${styles.tile} ${styles.tileRed}`}>
          <span className={styles.tileValue}>{percent}%</span>
          <span className={styles.tileLabel}>des défis relevés</span>
        </div>
        <div className={`${styles.glass} ${styles.tile} ${styles.tileGreen}`}>
          <span className={styles.tileValue}>{done}/{challenges.length}</span>
          <span className={styles.tileLabel}>participations envoyées</span>
        </div>
        <div className={`${styles.glass} ${styles.tile}`}>
          <span className={styles.tileValue}>J-{daysLeft}</span>
          <span className={styles.tileLabel}>avant le gala</span>
        </div>
        <div className={`${styles.glass} ${styles.tile}`}>
          <span className={styles.tileValue}>2×</span>
          <span className={styles.tileLabel}>5 000 000 Ar à gagner</span>
        </div>
      </div>

      <div className={`${styles.glass} p-5`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/65">Progression</p>
          <p className="text-[13px] font-semibold text-white/85">{done} sur {challenges.length}</p>
        </div>
        <div className={styles.bar} role="progressbar" aria-valuemin={0} aria-valuemax={challenges.length} aria-valuenow={done} aria-label="Défis relevés">
          <span className={styles.barFill} style={{ width: `${percent}%` }} />
        </div>
        <ul className="mt-4 flex flex-col gap-2">
          {challenges.map((c) => {
            const p = Boolean(mine[c.slug]);
            const s = challengeStatus(c);
            return (
              <li key={c.slug} className="flex items-center gap-3 text-[14px]">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${p ? "bg-[#007140] text-white" : "bg-white/10 text-white/70"}`}>
                  {p ? <CheckIcon width={15} height={15} strokeWidth={2.5} /> : s.key === "locked" ? <LockIcon width={13} height={13} /> : c.number}
                </span>
                <span className={`flex-1 truncate ${p ? "text-white" : "text-white/75"}`}>{c.title}</span>
                <span className="shrink-0 text-[12px] text-white/55">{p ? "Envoyé" : s.label}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {next ? (
        <Link href={`/decouvrir/${next.slug}`} className={`${styles.glass} ${styles.card} ${nextStatus?.key === "open" ? styles.featured : ""}`} style={{ minHeight: 0 }}>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/70">Prochaine étape</p>
          <p className="font-display text-[1.5rem] leading-tight">
            Défi {next.number} · {next.title}
          </p>
          <p className="text-[14px] leading-6 text-white/80">{next.summary}</p>
          <span className="mt-auto inline-flex items-center gap-1 text-[14px] font-semibold">
            {nextStatus?.key === "open" ? next.cta : nextStatus?.label}
            <ChevronRightIcon width={18} height={18} />
          </span>
        </Link>
      ) : (
        <div className={`${styles.glass} p-5 text-center`}>
          <p className="font-display text-[1.4rem]">Tous les défis sont relevés !</p>
          <p className="mt-1 text-[14px] text-white/75">Rendez-vous au gala pour l’annonce des gagnants.</p>
        </div>
      )}
    </div>
  );
}
