"use client";

import { useCallback, useState } from "react";
import type { DonneesFil } from "@/lib/fil";
import { Composer } from "../accueil/Composer";
import { Fil } from "../accueil/Fil";
import { Promos } from "../accueil/Promos";
import { Stories } from "../accueil/Stories";
import styles from "../accueil/accueil.module.css";

export function AdminAccueil({ fil }: { fil: DonneesFil }) {
  const [modeInitial, setModeInitial] = useState<"story" | null>(null);
  const consomme = useCallback(() => setModeInitial(null), []);
  return (
    <div className={styles.grille}>
      <div className={styles.colFil}>
        <Composer admin modeInitial={modeInitial} onModeConsomme={consomme} />
        <Stories admin onCreer={() => setModeInitial("story")} />
        <h2 className="mt-1 font-display text-[18px] text-graphite">Actualités</h2>
        <Fil admin {...fil} />
      </div>
      <Promos admin />
    </div>
  );
}
