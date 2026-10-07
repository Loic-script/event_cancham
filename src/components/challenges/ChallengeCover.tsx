import type { ReactNode } from "react";
import type { Challenge } from "@/lib/mock/challenges";
import styles from "./challenges.module.css";

type ChallengeCoverProps = {
  challenge: Challenge;
  className?: string;
  children?: ReactNode;
};

// Couverture d'un défi : la photo si elle existe, sinon une composition
// aux couleurs du défi avec son mot clé en filigrane.
export function ChallengeCover({ challenge, className = "", children }: ChallengeCoverProps) {
  return (
    <div className={`${styles.cover} ${className}`}>
      {challenge.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- image locale de taille libre
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
