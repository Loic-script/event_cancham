import { LockIcon } from "@/components/app/icons";
import type { ChallengeStatus } from "@/lib/mock/challenges";
import styles from "./challenges.module.css";

export function StatusChip({ status }: { status: ChallengeStatus }) {
  const cls = status.key === "open" ? styles.chipOpen : status.key === "locked" ? styles.chipLocked : styles.chipClosed;
  return (
    <span className={`${styles.chip} ${cls}`}>
      {status.key === "locked" ? <LockIcon width={13} height={13} /> : null}
      {status.label}
    </span>
  );
}
