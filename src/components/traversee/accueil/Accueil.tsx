"use client";

import { Composer } from "./Composer";
import { Fil } from "./Fil";
import { Promos } from "./Promos";
import { Stories } from "./Stories";
import styles from "./accueil.module.css";

export function Accueil() {
  return (
    <div className={styles.grille}>
      <div className={styles.colFil}>
        <Composer />
        <Stories />
        <div className={styles.titreFil}>
          <i aria-hidden />
          <h2>Actualités</h2>
          <small>Fil de la communauté</small>
        </div>
        <Fil />
      </div>
      <Promos />
    </div>
  );
}
