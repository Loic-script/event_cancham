"use client";

import { Composer, Fil } from "./Fil";
import { Promos } from "./Promos";
import { Stories } from "./Stories";
import styles from "./accueil.module.css";

export function Accueil() {
  return (
    <div className={styles.grille}>
      <div className={styles.colFil}>
        <Stories />
        <Composer />
        <h2 className="mt-1 font-display text-[18px] text-graphite">Actualités</h2>
        <Fil />
      </div>
      <Promos />
    </div>
  );
}
