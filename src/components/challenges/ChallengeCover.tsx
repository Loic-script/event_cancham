import type { ReactNode } from "react";
import type { Challenge } from "@/lib/mock/challenges";
import styles from "./challenges.module.css";

type ChallengeCoverProps = {
  challenge: Challenge;
  className?: string;
  children?: ReactNode;
};

export function ChallengeCover({ challenge, className = "", children }: ChallengeCoverProps) {
  return (
    <div className={`${styles.cover} ${className}`}>
      {challenge.coverImage ? (
        <img src={challenge.coverImage} alt="" className={styles.photo} />
      ) : (
        <div className={`${styles.art} ${styles[challenge.theme]}`} aria-hidden />
      )}
      <span className={styles.word} aria-hidden>
        {challenge.word}
      </span>
      <div className={styles.shade} aria-hidden />
      {children}
    </div>
  );
}
