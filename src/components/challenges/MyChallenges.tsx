"use client";

import Link from "next/link";
import { CheckIcon, ChevronRightIcon, LockIcon } from "@/components/app/icons";
import { challenges, challengeStatus } from "@/lib/mock/challenges";
import { useParticipations } from "./useParticipation";
import styles from "./challenges.module.css";

const shortDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

/** « 1/3 » : nombre de défis auxquels la personne a participé. */
export function ParticipationCount() {
  const mine = useParticipations();
  return <>{Object.keys(mine).length}/{challenges.length}</>;
}

/** Texte et barre de progression pour l'accueil. */
export function ChallengeProgress() {
  const count = Object.keys(useParticipations()).length;
  return (
    <>
      <span className="block text-[13px] text-graphite-muted">
        {count === 0 ? "Aucune participation" : `${count} participation${count > 1 ? "s" : ""}`} sur {challenges.length}
      </span>
      <span className="mt-3 block h-1.5 w-full overflow-hidden rounded-full bg-paper">
        <span className="block h-full rounded-full bg-gold transition-[width] duration-500" style={{ width: `${(count / challenges.length) * 100}%` }} />
      </span>
    </>
  );
}

/** Liste des trois défis avec l'état de la personne, pour le profil. */
export function MyChallenges() {
  const mine = useParticipations();
  return (
    <ul className="flex flex-col gap-2">
      {challenges.map((c) => {
        const p = mine[c.slug];
        const status = challengeStatus(c);
        return (
          <li key={c.slug}>
            <Link
              href={`/decouvrir/${c.slug}`}
              className="flex items-center gap-3 rounded-xl border border-line p-2.5 transition-colors hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm"
            >
              <span className={`${styles.miniCover} ${styles[c.theme]} h-11 w-11 text-[1.1rem]`}>{c.number}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold text-graphite">{c.title}</span>
                <span className="block truncate text-[12.5px] text-graphite-muted">
                  {p ? (
                    <span className="inline-flex items-center gap-1 text-palm-ink">
                      <CheckIcon width={13} height={13} />
                      Participation envoyée le {shortDate.format(new Date(p.submittedAt))}
                    </span>
                  ) : status.key === "locked" ? (
                    <span className="inline-flex items-center gap-1">
                      <LockIcon width={13} height={13} />
                      {status.label}
                    </span>
                  ) : status.key === "closed" ? (
                    "Terminé"
                  ) : (
                    "Pas encore participé"
                  )}
                </span>
              </span>
              <ChevronRightIcon width={18} height={18} className="shrink-0 text-graphite-faint" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
