"use client";

import type { DonneesFil } from "@/lib/fil";
import type { Promo, StoryVue } from "@/lib/traversee/galerie";
import { Composer } from "./Composer";
import { Fil } from "./Fil";
import { Promos } from "./Promos";
import { Stories } from "./Stories";
import styles from "./accueil.module.css";

export function Accueil({ fil, stories, promos }: { fil: DonneesFil; stories: StoryVue[]; promos: (Promo | null)[] }) {
  return (
    <div className={styles.grille}>
      <div className={styles.colFil}>
        <Composer />
        <Stories stories={stories} />
        <div className={styles.titreFil}>
          <i aria-hidden />
          <h2>Actualités</h2>
          <small>Fil de la communauté</small>
        </div>
        <Fil {...fil} />
      </div>
      <Promos promos={promos} />
    </div>
  );
}
