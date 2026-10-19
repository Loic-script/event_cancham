"use client";

import type { DonneesFil } from "@/lib/fil";
import { Composer } from "./Composer";
import { Fil } from "./Fil";
import { Promos } from "./Promos";
import { Stories } from "./Stories";
import styles from "./accueil.module.css";

export function Accueil({ fil }: { fil: DonneesFil }) {
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
        <Fil {...fil} />
      </div>
      <Promos />
    </div>
  );
}
