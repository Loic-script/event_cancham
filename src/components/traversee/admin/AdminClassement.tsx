"use client";

import { useMemo, useState } from "react";
import { useProfile } from "@/components/profile/useProfile";
import { fullName } from "@/lib/mock/data";
import { parseSocialLink } from "@/lib/social/links";
import { candidaturesTombola } from "@/lib/traversee/pitchs";
import { useTraversee } from "@/lib/traversee/store";
import { Classement, type EntreeClassement } from "../defis/Classement";
import { useLive } from "../defis/live";
import { Card, Direct, Recherche, Sur, ui } from "../ui";
import styles from "./candidatures.module.css";

export function AdminClassement() {
  const s = useTraversee();
  const me = useProfile();
  const inc = useLive(s.classement.length, 4);
  const [q, setQ] = useState("");

  const toutes = useMemo(() => candidaturesTombola(s, { nom: fullName(me), ent: me.company, role: me.role, sect: me.sector }), [s, me]);
  const entrees: EntreeClassement[] = toutes
    .map((c, i) => {
      const p = parseSocialLink(c.lien);
      return {
        nom: c.porteur,
        sous: c.ent,
        r: (c.reactions ?? 0) + (c.moi ? 0 : (inc[i] ?? 0)),
        moi: false,
        photo: c.moi ? me.photo || undefined : undefined,
        lien: p.ok ? p.url : c.lien,
        reseau: p.ok ? p.network : null,
      };
    })
    .sort((a, b) => b.r - a.r);

  const total = entrees.reduce((a, e) => a + e.r, 0);
  const tete = entrees[0];
  const ql = q.trim().toLowerCase();
  const recherche = ql ? entrees.map((e, i) => ({ e, rang: i + 1 })).filter(({ e }) => `${e.nom} ${e.sous ?? ""}`.toLowerCase().includes(ql)) : [];

  return (
    <>
      <div className={styles.tete}>
        <div>
          <p className={styles.surtitre}>Défi 2 · Gagnez 3 000 000 Ar</p>
          <h1>Classement des participants</h1>
          <p className={styles.chapo}>La publication « J’y serai » qui réunit le plus de réactions d’ici la fin du vote, pendant l’événement, l’emporte.</p>
        </div>
        <div className={styles.chiffres}>
          <div>
            <b>{entrees.length}</b>
            <small>participants</small>
          </div>
          <div>
            <b>{total.toLocaleString("fr-FR")}</b>
            <small>réactions</small>
          </div>
          <div>
            <b className={styles.enTete}>{tete ? tete.nom : "—"}</b>
            <small>en tête</small>
          </div>
        </div>
      </div>

      <div className={`${styles.outils} mt-5`}>
        <Recherche value={q} onChange={setQ} placeholder="Retrouver un participant dans le classement…" label="Rechercher un participant" className={styles.recherche} />
      </div>
      {ql ? (
        <div className={`${styles.resultats} mb-4`}>
          {recherche.length ? (
            recherche.map(({ e, rang }) => (
              <a key={e.nom} href={e.lien} target="_blank" rel="noopener noreferrer" className={styles.resultat}>
                <span className={styles.rang}>{rang}</span>
                <span className="min-w-0 flex-1">
                  <strong>{e.nom}</strong>
                  <small>{e.sous}</small>
                </span>
                <b>{e.r.toLocaleString("fr-FR")} réactions</b>
              </a>
            ))
          ) : (
            <p className={styles.aucune}>Aucun participant ne correspond.</p>
          )}
        </div>
      ) : null}

      <Card bleed>
        <div className={`${ui.pad} flex flex-wrap items-center justify-between gap-2.5 !pb-2`}>
          <Sur className="!mb-0">Classement des publications</Sur>
          <Direct>En temps réel · simulation</Direct>
        </div>
        <Classement entrees={entrees} />
      </Card>
    </>
  );
}
