"use client";

import { useState, type ReactNode } from "react";
import { useProfile } from "@/components/profile/useProfile";
import { ANNUAIRE, ouEst } from "@/lib/traversee/data";
import { aLaTable, occupation, libresTotal, siegesDe } from "@/lib/traversee/sieges";
import { setTraversee, toast, useTraversee, type TraverseeState } from "@/lib/traversee/store";
import { fullName } from "@/lib/mock/data";
import { RdvModal } from "../annuaire/RdvModal";
import { Btn, Card, PageHead, Puce, Sur, ui } from "../ui";
import styles from "./place.module.css";

export function Chaises({ s, n, grand = false, admin = false, choisi, onChaise }: { s: TraverseeState; n: number; grand?: boolean; admin?: boolean; choisi?: number | null; onChaise?: (k: number) => void }) {
  const sieges = siegesDe(s)[n];
  return (
    <>
      {Array.from({ length: 10 }, (_, k) => {
        const c = sieges[k];
        const moi = s.table === n && s.siege === k;
        const pris = Boolean(c) && !moi;
        const cls = `${styles.ch} ${moi ? styles.moi : pris ? "" : styles.libre} ${admin && pris ? styles.editable : ""} ${choisi === k ? styles.choisi : ""}`;
        if (!grand) return <i key={k} className={cls} style={{ "--k": k } as React.CSSProperties} />;
        return (
          <button
            key={k}
            type="button"
            className={cls}
            style={{ "--k": k } as React.CSSProperties}
            disabled={pris && !admin}
            onClick={() => onChaise?.(k)}
            title={pris && c ? `${c.nom} · ${c.ent}` : moi ? "Votre chaise" : "Chaise libre"}
            aria-label={`Chaise ${k + 1}${pris && c ? `, ${c.nom}` : moi ? ", la vôtre" : ", libre"}`}
          >
            <span>{k + 1}</span>
          </button>
        );
      })}
    </>
  );
}

export function Plan({ s, vue, trouver, onTable, admin = false, children }: { s: TraverseeState; vue: number | null; trouver: string; onTable: (n: number) => void; admin?: boolean; children?: ReactNode }) {
  return (
    <Card bleed>
      <div className={styles.scene}>Scène</div>
      <div className={styles.salle}>
        {Array.from({ length: 24 }, (_, k) => {
          const n = k + 1;
          const o = occupation(s, n);
          const cls = `${styles.table} ${s.table === n && !admin ? styles.mienne : ""} ${o >= 10 ? styles.pleine : ""} ${vue === n ? styles.vue : ""} ${trouver && aLaTable(s, n, trouver) ? styles.trouvee : ""}`;
          return (
            <button key={n} type="button" className={cls} style={{ "--i": k } as React.CSSProperties} onClick={() => onTable(n)} aria-label={`Table ${n}, ${o >= 10 ? "complète" : `${10 - o} places libres`}`}>
              <Chaises s={s} n={n} />
              <span className={styles.disque}>
                <b>{n}</b>
                <small>{s.table === n && !admin ? "Ma table" : o >= 10 ? "Complète" : admin ? `${o} / 10` : `${10 - o} libres`}</small>
              </span>
            </button>
          );
        })}
      </div>
      <div className={styles.reperes}>
        <span>Entrée</span>
        <span>Bar</span>
        <span>Sortie</span>
      </div>
      <div className={styles.legende}>
        <span>
          <i className={styles.l} />
          Chaise libre
        </span>
        <span>
          <i />
          Chaise occupée
        </span>
        <span>
          <i className={styles.m} />
          {admin ? "Participant de la maquette" : "Votre chaise"}
        </span>
      </div>
      {children}
    </Card>
  );
}

export function TrouverEntreprise({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className={ui.outils}>
      <select className={ui.saisie} style={{ width: "auto" }} value={value} onChange={(e) => onChange(e.target.value)} aria-label="Trouver une entreprise sur le plan">
        <option value="">Trouver une entreprise sur le plan…</option>
        {ANNUAIRE.map((x) => (
          <option key={x.nom} value={x.nom}>
            {x.nom}
          </option>
        ))}
      </select>
      <Puce tone="grey">Plan et convives d’exemple</Puce>
    </div>
  );
}

export function PlanSalle() {
  const s = useTraversee();
  const me = useProfile();
  const [vue, setVue] = useState<number | null>(null);
  const [trouver, setTrouver] = useState("");
  const [rdv, setRdv] = useState<string | null>(null);
  const libres = libresTotal(s);
  const occ = vue ? occupation(s, vue) : 0;
  const sieges = vue ? siegesDe(s)[vue] : [];

  function reserver(k: number) {
    if (!vue) return;
    setTraversee({ table: vue, siege: k });
    toast(`Place réservée : table ${vue}, chaise ${k + 1}.`);
  }

  return (
    <>
      <PageHead title="Ma place au" accent="Gala" text="Choisissez votre table, puis votre chaise. Voyez qui est inscrit à chaque table pour préparer vos échanges." photo="salle">
        <Puce tone="white">{libres} places libres sur 240</Puce>
      </PageHead>
      <TrouverEntreprise value={trouver} onChange={setTrouver} />
      <div className={ui.gLarge}>
        <Plan s={s} vue={vue} trouver={trouver} onTable={setVue} />
        <Card pad bleed className="grid gap-3.5">
          {vue ? (
            <>
              <div>
                <Sur>Table {vue}</Sur>
                <h3 className="font-display text-[18px] text-graphite">{ouEst(vue)}</h3>
                <p className="text-graphite-muted">{occ >= 10 && s.table !== vue ? "Table complète. Vous pouvez tout de même voir qui y est inscrit." : `${10 - occ} chaises libres. Touchez une chaise libre pour la réserver.`}</p>
              </div>
              <div className={styles.grande}>
                <Chaises s={s} n={vue} grand onChaise={reserver} />
                <span className={styles.disque}>
                  <b>{vue}</b>
                </span>
              </div>
              <div>
                <Sur>Qui est à cette table</Sur>
                <ul className={styles.convives}>
                  {sieges.map((c, k) => {
                    const moi = s.table === vue && s.siege === k;
                    if (moi) {
                      return (
                        <li key={k}>
                          <span className={`${styles.no} ${styles.moi}`}>{k + 1}</span>
                          <div className="min-w-0">
                            <strong>{fullName(me)} (vous)</strong>
                            <small>{me.company || "Votre entreprise"}</small>
                            <small>{me.role || "Votre fonction"}</small>
                          </div>
                          <span />
                        </li>
                      );
                    }
                    if (!c) return null;
                    return (
                      <li key={k}>
                        <span className={styles.no}>{k + 1}</span>
                        <div className="min-w-0">
                          <strong>{c.nom}</strong>
                          <small>{c.ent}</small>
                          <small>{c.role}</small>
                        </div>
                        <span className={styles.act}>
                          <Btn small href="/messages">
                            Écrire
                          </Btn>
                          <Btn small variant="primary" onClick={() => setRdv(`${c.nom} · ${c.ent}`)}>
                            RDV
                          </Btn>
                        </span>
                      </li>
                    );
                  })}
                  {occ === 0 ? (
                    <li style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
                      <small>Personne n’est encore inscrit à cette table.</small>
                    </li>
                  ) : null}
                </ul>
              </div>
              {s.table === vue ? (
                <>
                  <Puce tone="green" className="w-fit">
                    Votre place : table {vue}, chaise {(s.siege ?? 0) + 1}
                  </Puce>
                  <Btn
                    onClick={() => {
                      setTraversee({ table: null, siege: null });
                      toast("Place libérée.");
                    }}
                  >
                    Libérer ma place
                  </Btn>
                </>
              ) : null}
            </>
          ) : s.table ? (
            <>
              <div>
                <Sur>Ma place</Sur>
                <h3 className="font-display text-[18px] text-graphite">
                  Table {s.table}, chaise {(s.siege ?? 0) + 1}
                </h3>
                <p className="text-graphite-muted">{ouEst(s.table)}.</p>
              </div>
              <Btn onClick={() => setVue(s.table)}>Voir ma table</Btn>
            </>
          ) : (
            <div className={ui.vide}>Sélectionnez une table sur le plan pour voir ses dix chaises.</div>
          )}
        </Card>
      </div>
      {rdv ? <RdvModal nom={rdv} onClose={() => setRdv(null)} /> : null}
    </>
  );
}
