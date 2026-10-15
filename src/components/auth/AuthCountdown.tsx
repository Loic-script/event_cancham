"use client";

import { Fragment, useSyncExternalStore } from "react";
import styles from "./auth.module.css";

type AuthCountdownProps = {
  target: string;
  initialRemaining: number;
};

function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 1000);
  return () => window.clearInterval(id);
}

export function AuthCountdown({ target, initialRemaining }: AuthCountdownProps) {
  const targetMs = new Date(target).getTime();
  const remaining = useSyncExternalStore(
    subscribe,
    () => Math.max(0, Math.floor((targetMs - Date.now()) / 1000)),
    () => Math.max(0, initialRemaining),
  );

  if (remaining === 0) return null;

  const days = Math.floor(remaining / 86_400);
  const hours = Math.floor((remaining % 86_400) / 3_600);
  const minutes = Math.floor((remaining % 3_600) / 60);
  const seconds = remaining % 60;

  const units = [
    { key: "days", value: String(days).padStart(2, "0"), label: days > 1 ? "jours" : "jour" },
    { key: "hours", value: String(hours).padStart(2, "0"), label: "heures" },
    { key: "minutes", value: String(minutes).padStart(2, "0"), label: "min" },
    { key: "seconds", value: String(seconds).padStart(2, "0"), label: "sec" },
  ];

  return (
    <div className={styles.countdown} role="timer" aria-label={`Le gala commence dans ${days} jours, ${hours} heures et ${minutes} minutes`}>
      {units.map((u, i) => (
        <Fragment key={u.key}>
          {i > 0 ? (
            <span className={styles.countdownSep} aria-hidden>
              :
            </span>
          ) : null}
          <span className={styles.countdownUnit} aria-hidden>
            <span className={styles.countdownFace}>
              <span key={u.value} className={styles.countdownValue}>
                {u.value}
              </span>
            </span>
            <span className={styles.countdownLabel}>{u.label}</span>
          </span>
        </Fragment>
      ))}
    </div>
  );
}
