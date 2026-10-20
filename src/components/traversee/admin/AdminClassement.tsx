"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { retirerDuClassement } from "@/app/(app)/defis/actions";
import { TrashIcon } from "@/components/app/icons";
import type { Participant } from "@/lib/defis";
import { parseSocialLink } from "@/lib/social/links";
import { toast } from "@/lib/traversee/store";
import { Confirmer } from "../Confirmer";
import { Classement, LienPublication, type EntreeClassement } from "../defis/Classement";
import cl from "../defis/classement.module.css";
import { AvatarInitiales, Btn, Card, Recherche, Sur, ui } from "../ui";
import styles from "./candidatures.module.css";

const RELEVE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Indian/Antananarivo" });

/** Classement du Défi 2 à partir des publications enregistrées et de leur dernier relevé de réactions. */
export function AdminClassement({ publications }: { publications: Participant[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [aRetirer, setARetirer] = useState<EntreeClassement | null>(null);

  const entrees: (EntreeClassement & { retire: boolean })[] = publications
    .map((c) => {
      const p = parseSocialLink(c.lien);
      return {
        id: c.id,
        nom: c.porteur,
        sous: [c.ent, c.releveLe ? `relevé le ${RELEVE.format(new Date(c.releveLe)).replace(":", " h ")}` : "réactions pas encore relevées"].filter(Boolean).join(" · "),
        r: c.reactions ?? 0,
        moi: false,
        photo: c.photo ?? undefined,
        lien: p.ok ? p.url : c.lien,
        reseau: p.ok && (p.network === "facebook" || p.network === "instagram") ? p.network : null,
        retire: c.retire,
      };
    })
    .sort((a, b) => b.r - a.r);
  const actives = entrees.filter((e) => !e.retire);
  const retirees = entrees.filter((e) => e.retire);

  const total = actives.reduce((a, e) => a + e.r, 0);
  const tete = actives[0];
  const ql = q.trim().toLowerCase();
  const recherche = ql ? actives.map((e, i) => ({ e, rang: i + 1 })).filter(({ e }) => `${e.nom} ${e.sous ?? ""}`.toLowerCase().includes(ql)) : [];

  async function changer(e: EntreeClassement, retire: boolean) {
    const { error } = await retirerDuClassement(e.id, retire);
    setARetirer(null);
    if (error) return toast(error);
    toast(retire ? `Publication de ${e.nom} retirée du classement.` : `Publication de ${e.nom} rétablie dans le classement.`);
    router.refresh();
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
          <p className={`${styles.aucune} mx-5 mb-5`}>Aucune publication enregistrée pour l’instant.</p>
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
                  <Btn small onClick={() => void changer(e, false)}>
                    Rétablir
                  </Btn>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {aRetirer ? (
        <Confirmer titre={`Retirer la publication de ${aRetirer.nom} ?`} action="Retirer du classement" onConfirmer={() => void changer(aRetirer, true)} onClose={() => setARetirer(null)}>
          <p>Elle disparaît du classement du Défi 2, ici comme dans l’espace participant. Vous pourrez la rétablir à tout moment.</p>
        </Confirmer>
      ) : null}
    </>
  );
}
