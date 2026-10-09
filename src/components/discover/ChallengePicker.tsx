"use client";

import Link from "next/link";
import type { PointerEvent } from "react";
import { ArrowRightIcon, CameraIcon, FilmIcon, LockIcon } from "@/components/app/icons";
import { StatusChip } from "@/components/challenges/StatusChip";
import type { ChallengeStatus } from "@/lib/mock/challenges";
import styles from "./picker.module.css";

export type PickerChallenge = {
  slug: string;
  number: 1 | 2 | 3;
  phase: string;
  title: string;
  hook: string;
  prize: string;
  kind: "photo" | "video";
  status: ChallengeStatus;
};

type ChallengePickerProps = {
  items: PickerChallenge[];
};

function spotlight(e: PointerEvent<HTMLAnchorElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
}

export function ChallengePicker({ items }: ChallengePickerProps) {
  return (
    <div className={styles.grid}>
      {items.map((c) => {
        const Kind = c.kind === "video" ? FilmIcon : CameraIcon;
        return (
          <Link
            key={c.slug}
            href={`/decouvrir/${c.slug}`}
            onPointerMove={spotlight}
            className={`${styles.card} ${styles[`tone${c.number}`]}`}
            aria-label={`Défi ${c.number} : ${c.title}, ${c.status.label}`}
          >
            <div className={styles.inner}>
              <div className={styles.top}>
                <span className={styles.phase}>{c.phase}</span>
                <StatusChip status={c.status} />
              </div>

              <div className={styles.art} aria-hidden>
                <span className={styles.bigNo}>{c.number}</span>
                <span className={styles.ring}>
                  <i />
                </span>
                <span className={`${styles.spark} ${styles.sparkA}`} />
                <span className={`${styles.spark} ${styles.sparkB}`} />
                <span className={styles.tile}>
                  <Kind width={38} height={38} strokeWidth={1.6} />
                  {c.status.key === "locked" ? (
                    <span className={styles.lock}>
                      <LockIcon width={16} height={16} />
                    </span>
                  ) : null}
                </span>
              </div>

              <h3 className={styles.title}>{c.title}</h3>
              <p className={styles.hook}>{c.hook}</p>

              <div className={styles.foot}>
                <span className={styles.prize}>{c.kind === "video" ? "Mission Canada" : c.prize}</span>
                <span className={styles.go} aria-hidden>
                  <ArrowRightIcon width={24} height={24} strokeWidth={2} />
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
