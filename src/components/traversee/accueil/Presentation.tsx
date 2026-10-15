"use client";

import { useSyncExternalStore } from "react";
import { GiftIcon, TrophyIcon } from "@/components/app/icons";
import { IMG, LIEU_LONG } from "@/lib/traversee/data";
import { event } from "@/lib/mock/data";
import { Btn } from "../ui";
import styles from "./accueil.module.css";

const CIBLE = new Date(event.date).getTime();

function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 1000);
  return () => window.clearInterval(id);
}

function restant() {
  return Math.max(0, Math.floor((CIBLE - Date.now()) / 1000));
}

export function Presentation({ initial }: { initial: number }) {
  const s = useSyncExternalStore(subscribe, restant, () => initial);
  const tuiles = [
    { v: String(Math.floor(s / 86_400)), l: "jours" },
    { v: String(Math.floor((s % 86_400) / 3_600)).padStart(2, "0"), l: "heures" },
    { v: String(Math.floor((s % 3_600) / 60)).padStart(2, "0"), l: "min" },
    { v: String(s % 60).padStart(2, "0"), l: "sec" },
  ];

  return (
    <section className={`${styles.presentation} m-bleed`} style={{ "--ph": `url(${IMG("hero")})` } as React.CSSProperties} aria-labelledby="presentation-titre">
      <span className={styles.halo} aria-hidden />
      <div className={styles.presTexte}>
        <p className={styles.presSur}>{event.edition} · {event.dateLabel}</p>
        <h2 id="presentation-titre">
          La Traversée <em>commence dans</em>
        </h2>
        <p className={styles.presLieu}>{LIEU_LONG}</p>
      </div>
      <div className={styles.horloge} role="timer" aria-live="off" aria-label={s === 0 ? "Le gala a commencé" : `Le gala commence dans ${tuiles[0].v} jours, ${tuiles[1].v} heures, ${tuiles[2].v} minutes et ${tuiles[3].v} secondes`}>
        {tuiles.map((t) => (
          <div key={t.l} className={styles.tuile}>
            <b key={t.v}>{t.v}</b>
            <small>{t.l}</small>
          </div>
        ))}
      </div>
      <div className={styles.presBoutons}>
        <Btn variant="primary" href="/defis/tombola">
          <GiftIcon width={18} height={18} />
          Gagnez 3 000 000 Ar
        </Btn>
        <Btn variant="ghost" href="/defis/pitch">
          <TrophyIcon width={18} height={18} />
          Gagnez un voyage au Canada
        </Btn>
      </div>
    </section>
  );
}
