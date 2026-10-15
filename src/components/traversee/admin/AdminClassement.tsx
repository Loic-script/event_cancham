"use client";

import { useMemo, useState } from "react";
import { TrashIcon } from "@/components/app/icons";
import { useProfile } from "@/components/profile/useProfile";
import { fullName } from "@/lib/mock/data";
import { parseSocialLink } from "@/lib/social/links";
import { candidaturesTombola } from "@/lib/traversee/pitchs";
import { journaliser, setTraversee, toast, useTraversee } from "@/lib/traversee/store";
import { Confirmer } from "../Confirmer";
import { Classement, LienPublication, type EntreeClassement } from "../defis/Classement";
import cl from "../defis/classement.module.css";
import { useLive } from "../defis/live";
import { AvatarInitiales, Btn, Card, Direct, Recherche, Sur, ui } from "../ui";
import styles from "./candidatures.module.css";

export function AdminClassement() {
  const s = useTraversee();
  const me = useProfile();
  const inc = useLive(s.classement.length, 4);
  const [q, setQ] = useState("");
  const [aRetirer, setARetirer] = useState<EntreeClassement | null>(null);

  const toutes = useMemo(() => candidaturesTombola(s, { nom: fullName(me), ent: me.company, role: me.role, sect: me.sector }), [s, me]);
  const retraits = new Set(s.retraitsTombola);
  const entrees: EntreeClassement[] = toutes
    .map((c, i) => {
      const p = parseSocialLink(c.lien);
      return {
        id: c.id,
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
  const actives = entrees.filter((e) => !retraits.has(e.id!));
  const retirees = entrees.filter((e) => retraits.has(e.id!));

  const total = actives.reduce((a, e) => a + e.r, 0);
  const tete = actives[0];
  const ql = q.trim().toLowerCase();
  const recherche = ql ? actives.map((e, i) => ({ e, rang: i + 1 })).filter(({ e }) => `${e.nom} ${e.sous ?? ""}`.toLowerCase().includes(ql)) : [];

  function retirer(e: EntreeClassement) {
    setTraversee((st) => ({ retraitsTombola: [...st.retraitsTombola.filter((id) => id !== e.id), e.id!] }));
    setARetirer(null);
    if (e.id === "moi") journaliser({ pour: "participant", type: "defi2", titre: "Votre publication a été retirée du classement", texte: "L’équipe CanCham a retiré votre publication « J’y serai » du Défi 2.", href: "/defis/tombola" });
    toast(`Publication de ${e.nom} retirée du classement.`);
  }

  function retablir(e: EntreeClassement) {
    setTraversee((st) => ({ retraitsTombola: st.retraitsTombola.filter((id) => id !== e.id) }));
    if (e.id === "moi") journaliser({ pour: "participant", type: "defi2", titre: "Votre publication est de retour dans le classement", texte: "Votre publication « J’y serai » compte à nouveau pour le Défi 2.", href: "/defis/tombola" });
    toast(`Publication de ${e.nom} rétablie dans le classement.`);
  }

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
            <b>{actives.length}</b>
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
        {actives.length ? (
          <Classement
            entrees={actives}
            avecPodium={false}
            actions={(e) => (
              <>
                <LienPublication e={e} />
                <button type="button" className={cl.retirer} onClick={() => setARetirer(e)} aria-label={`Retirer la publication de ${e.nom}`}>
                  <TrashIcon width={14} height={14} />
                  Retirer
                </button>
              </>
            )}
          />
        ) : (
          <p className={`${styles.aucune} mx-5 mb-5`}>Aucune publication dans le classement.</p>
        )}
      </Card>

      {retirees.length ? (
        <Card bleed className="mt-5">
          <div className={`${ui.pad} !pb-2`}>
            <Sur className="!mb-0">Publications retirées · {retirees.length}</Sur>
          </div>
          <ul className={styles.retirees}>
            {retirees.map((e) => (
              <li key={e.id} className={styles.retiree}>
                <AvatarInitiales nom={e.nom} photo={e.photo} size={40} />
                <span className="min-w-0 flex-1">
                  <strong>{e.nom}</strong>
                  <small>
                    {e.sous} · {e.r.toLocaleString("fr-FR")} réactions
                  </small>
                </span>
                <span className={cl.actions}>
                  <LienPublication e={e} compact />
                  <Btn small onClick={() => retablir(e)}>
                    Rétablir
                  </Btn>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {aRetirer ? (
        <Confirmer titre={`Retirer la publication de ${aRetirer.nom} ?`} action="Retirer du classement" onConfirmer={() => retirer(aRetirer)} onClose={() => setARetirer(null)}>
          <p>Elle disparaît du classement du Défi 2, ici comme dans l’espace participant. Vous pourrez la rétablir à tout moment.</p>
        </Confirmer>
      ) : null}
    </>
  );
}
