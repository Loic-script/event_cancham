"use client";

import { useSyncExternalStore } from "react";
import styles from "./app.module.css";

type CountdownProps = {
  target: string;
  initialRemaining: number;
  caption: string;
  className?: string;
};

function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 1000);
  return () => window.clearInterval(id);
}

function split(totalSeconds: number) {
  const s = Math.max(0, totalSeconds);
  return {
    days: Math.floor(s / 86_400),
    hours: Math.floor((s % 86_400) / 3_600),
    minutes: Math.floor((s % 3_600) / 60),
    seconds: s % 60,
  };
}

export function Countdown({ target, initialRemaining, caption, className = "" }: CountdownProps) {
  const targetMs = new Date(target).getTime();
  const remaining = useSyncExternalStore(
    subscribe,
    () => Math.floor((targetMs - Date.now()) / 1000),
    () => initialRemaining,
  );
  const { days, hours, minutes, seconds } = split(remaining);
  const over = remaining <= 0;

  const tiles = [
    { value: String(days), label: "j" },
    { value: String(hours).padStart(2, "0"), label: "h" },
    { value: String(minutes).padStart(2, "0"), label: "min" },
    { value: String(seconds).padStart(2, "0"), label: "sec" },
  ];

  return (
    <div className={`${styles.glass} rounded-2xl px-4 py-4 ${className}`} role="timer" aria-live="off" aria-label={over ? "Le gala a commencé" : `Le gala commence dans ${days} jours, ${hours} heures, ${minutes} minutes et ${seconds} secondes`}>
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-graphite">{over ? "Le gala a commencé" : "Le gala commence dans"}</p>
      <div className="mt-3 grid grid-cols-4 gap-2" aria-hidden>
        {tiles.map((t) => (
          <div key={t.label} className={styles.cdTile}>
            <span key={t.value} className={`${styles.cdValue} font-display`}>
              {t.value}
            </span>
            <span className={styles.cdLabel}>{t.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-[12.5px] text-graphite-muted">{caption}</p>
    </div>
  );
}
