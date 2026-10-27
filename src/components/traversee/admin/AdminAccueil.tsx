"use client";

import { useCallback, useState } from "react";
import type { DonneesFil } from "@/lib/fil";
import type { Promo, StoryVue } from "@/lib/traversee/galerie";
import { Composer } from "../accueil/Composer";
import { Fil } from "../accueil/Fil";
import { Promos } from "../accueil/Promos";
import { Stories } from "../accueil/Stories";
import styles from "../accueil/accueil.module.css";

export function AdminAccueil({ fil, stories, promos }: { fil: DonneesFil; stories: StoryVue[]; promos: (Promo | null)[] }) {
  const [modeInitial, setModeInitial] = useState<"story" | null>(null);
  const consomme = useCallback(() => setModeInitial(null), []);
  return (
    <div className={styles.grille}>
      <div className={styles.colFil}>
        <Composer admin modeInitial={modeInitial} onModeConsomme={consomme} />
        <Stories stories={stories} admin onCreer={() => setModeInitial("story")} />
        <div className={styles.titreFil}>
          <i aria-hidden />
          <h2>Actualités</h2>
          <small>Fil de la communauté</small>
        </div>
        <Fil admin {...fil} />
      </div>
      <Promos promos={promos} admin />
    </div>
  );
}
