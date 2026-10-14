"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { GridIcon, ListIcon } from "@/components/app/icons";
import { Recherche } from "@/components/traversee/ui";
import type { Filtre } from "@/lib/ressources/requetes";
import { CATEGORIES_PLURIEL, type Categorie } from "@/lib/ressources/types";
import { lienBibli, type ParamsBibli } from "./liens";
import styles from "./bibliotheque.module.css";

type Props = { base: string; params: ParamsBibli; compteurs: Record<Filtre, number>; dansDossier: boolean };

export function Outils({ base, params, compteurs, dansDossier }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(params.q);
  const [, demarrer] = useTransition();
  const precedent = useRef(params.q);

  useEffect(() => {
    if (q === precedent.current) return;
    const id = window.setTimeout(() => {
      precedent.current = q;
      demarrer(() => router.replace(lienBibli(base, params, { q: q.trim() }), { scroll: false }));
    }, 280);
    return () => window.clearTimeout(id);
  }, [q, base, params, router]);

  const toutes: { v: Filtre; label: string }[] = [{ v: "tout", label: "Tout" }, ...(Object.keys(CATEGORIES_PLURIEL) as Categorie[]).map((c): { v: Filtre; label: string } => ({ v: c, label: CATEGORIES_PLURIEL[c] }))];
  const filtres = toutes.filter((f) => f.v === "tout" || compteurs[f.v] > 0 || params.filtre === f.v);
  const tri = params.tri === "ordre" && !dansDossier ? "date" : params.tri;

  return (
    <div className={styles.outils}>
      <Recherche value={q} onChange={setQ} placeholder="Rechercher un document, un dossier…" label="Rechercher dans la bibliothèque" className={styles.recherche} />
      <nav className={styles.filtres} aria-label="Filtrer par catégorie">
        {filtres.map((f) => (
          <Link key={f.v} href={lienBibli(base, params, { filtre: f.v })} aria-current={params.filtre === f.v ? "page" : undefined} scroll={false}>
            {f.label}
            <b>{compteurs[f.v]}</b>
          </Link>
        ))}
      </nav>
      <select
        className={styles.selectTri}
        aria-label="Trier"
        value={tri}
        onChange={(e) => demarrer(() => router.replace(lienBibli(base, params, { tri: e.target.value }), { scroll: false }))}
      >
        {dansDossier ? <option value="ordre">Ordre du parcours</option> : null}
        <option value="date">Plus récentes</option>
        <option value="nom">Nom (A → Z)</option>
      </select>
      <div className={styles.vues} role="group" aria-label="Affichage">
        <Link href={lienBibli(base, params, { vue: "grille" })} aria-current={params.vue !== "liste" ? "page" : undefined} aria-label="Grille" scroll={false}>
          <GridIcon width={18} height={18} />
        </Link>
        <Link href={lienBibli(base, params, { vue: "liste" })} aria-current={params.vue === "liste" ? "page" : undefined} aria-label="Liste" scroll={false}>
          <ListIcon width={18} height={18} />
        </Link>
      </div>
    </div>
  );
}
