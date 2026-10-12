"use client";

import { useState, type FormEvent } from "react";
import { useProfile } from "@/components/profile/useProfile";
import { ouEst } from "@/lib/traversee/data";
import { libresTotal, modifieSieges, occupation, siegesDe } from "@/lib/traversee/sieges";
import { setTraversee, toast, useTraversee } from "@/lib/traversee/store";
import { fullName } from "@/lib/mock/data";
import { Chaises, Plan, TrouverEntreprise } from "../place/PlanSalle";
import placeStyles from "../place/place.module.css";
import { Btn, Card, Champ, PageHead, Puce, Sur, ui } from "../ui";
import styles from "./admin.module.css";

export function AdminPlaces() {
  const s = useTraversee();
  const me = useProfile();
  const [vue, setVue] = useState<number | null>(null);
  const [trouver, setTrouver] = useState("");
  const [chaise, setChaise] = useState<number | null>(null);
  const [f, setF] = useState({ nom: "", ent: "", role: "", table: 1, k: 0 });
  const total = 240 - libresTotal(s);
  const occ = vue ? occupation(s, vue) : 0;
  const sieges = vue ? siegesDe(s)[vue] : [];

  function ouvrir(k: number) {
    if (!vue) return;
    const c = sieges[k];
    setChaise(k);
    setF({ nom: c?.nom ?? "", ent: c?.ent ?? "", role: c?.role ?? "", table: vue, k });
  }

  function enregistrer(e: FormEvent) {
    e.preventDefault();
    if (vue === null || chaise === null) return;
    const occupe = siegesDe(s)[f.table][f.k] && !(f.table === vue && f.k === chaise);
    if (occupe || (s.table === f.table && s.siege === f.k)) return toast(`La chaise ${f.k + 1} de la table ${f.table} est déjà occupée.`);
    const anc = siegesDe(s)[vue][chaise];
    const depuis = vue;
    const depuisK = chaise;
    modifieSieges((sg) => {
      sg[depuis][depuisK] = null;
      sg[f.table][f.k] = { nom: f.nom.trim(), ent: f.ent.trim(), role: f.role.trim(), sect: anc?.sect ?? "" };
    });
    setVue(f.table);
    setChaise(null);
    toast(`Place enregistrée : table ${f.table}, chaise ${f.k + 1}.`);
  }

  function liberer(n: number, k: number) {
    modifieSieges((sg) => {
      sg[n][k] = null;
    });
    setChaise(null);
    toast("Place libérée.");
  }

  return (
    <>
      <PageHead title="Gestion des" accent="places" text="Le même plan que les participants. Ouvrez une table pour modifier, déplacer ou supprimer une place." photo="salle">
        <Puce tone="white">{total} places attribuées sur 240</Puce>
      </PageHead>
      <TrouverEntreprise value={trouver} onChange={setTrouver} />
      <div className={ui.gLarge}>
        <Plan
          s={s}
          vue={vue}
          trouver={trouver}
          admin
          onTable={(n) => {
            setVue(n);
            setChaise(null);
          }}
        />
        <Card pad bleed className="grid gap-3.5">
          {vue ? (
            <>
              <div>
                <Sur>Table {vue}</Sur>
                <h3 className="font-display text-[18px] text-graphite">{ouEst(vue)}</h3>
                <p className="text-graphite-muted">{occ} places occupées. Touchez une chaise pour l’attribuer ou la modifier.</p>
              </div>
              <div className={placeStyles.grande}>
                <Chaises s={s} n={vue} grand admin choisi={chaise} onChaise={ouvrir} />
                <span className={placeStyles.disque}>
                  <b>{vue}</b>
                </span>
              </div>
              {chaise !== null ? (
                <form onSubmit={enregistrer} className={styles.siegeForm}>
                  <Sur className="!mb-0">{sieges[chaise]?.nom ? "Modifier la place" : `Attribuer la chaise ${chaise + 1}`}</Sur>
                  <Champ label="Nom et prénom" htmlFor="sg-nom">
                    <input id="sg-nom" className={ui.saisie} required value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} />
                  </Champ>
                  <Champ label="Entreprise" htmlFor="sg-ent">
                    <input id="sg-ent" className={ui.saisie} required value={f.ent} onChange={(e) => setF({ ...f, ent: e.target.value })} />
                  </Champ>
                  <Champ label="Rôle dans l’entreprise" htmlFor="sg-role">
                    <input id="sg-role" className={ui.saisie} required value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} />
                  </Champ>
                  <div className={ui.g2}>
                    <Champ label="Table" htmlFor="sg-table">
                      <select id="sg-table" className={ui.saisie} value={f.table} onChange={(e) => setF({ ...f, table: Number(e.target.value) })}>
                        {Array.from({ length: 24 }, (_, k) => (
                          <option key={k} value={k + 1}>
                            Table {k + 1}
                          </option>
                        ))}
                      </select>
                    </Champ>
                    <Champ label="Chaise" htmlFor="sg-chaise">
                      <select id="sg-chaise" className={ui.saisie} value={f.k} onChange={(e) => setF({ ...f, k: Number(e.target.value) })}>
                        {Array.from({ length: 10 }, (_, k) => (
                          <option key={k} value={k}>
                            Chaise {k + 1}
                          </option>
                        ))}
                      </select>
                    </Champ>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Btn variant="primary" type="submit">
                      Enregistrer
                    </Btn>
                    {sieges[chaise] ? <Btn onClick={() => liberer(vue, chaise)}>Supprimer</Btn> : null}
                    <Btn onClick={() => setChaise(null)}>Annuler</Btn>
                  </div>
                </form>
              ) : null}
              <div>
                <Sur>Qui est à cette table</Sur>
                <ul className={placeStyles.convives}>
                  {sieges.map((c, k) => {
                    const moi = s.table === vue && s.siege === k;
                    if (moi) {
                      return (
                        <li key={k}>
                          <span className={`${placeStyles.no} ${placeStyles.moi}`}>{k + 1}</span>
                          <div className="min-w-0">
                            <strong>{fullName(me)}</strong>
                            <small>{me.company || "Entreprise à renseigner"}</small>
                            <small>{me.role || "Fonction à renseigner"}</small>
                          </div>
                          <span className={placeStyles.act}>
                            <Btn
                              small
                              onClick={() => {
                                setTraversee({ table: null, siege: null });
                                toast("Place du participant libérée.");
                              }}
                            >
                              Supprimer
                            </Btn>
                          </span>
                        </li>
                      );
                    }
                    if (!c) return null;
                    return (
                      <li key={k}>
                        <span className={placeStyles.no}>{k + 1}</span>
                        <div className="min-w-0">
                          <strong>{c.nom}</strong>
                          <small>{c.ent}</small>
                          <small>{c.role}</small>
                        </div>
                        <span className={placeStyles.act}>
                          <Btn small onClick={() => ouvrir(k)}>
                            Modifier
                          </Btn>
                          <Btn small onClick={() => liberer(vue, k)}>
                            Supprimer
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
            </>
          ) : (
            <div className={ui.vide}>Sélectionnez une table sur le plan pour gérer ses dix chaises.</div>
          )}
        </Card>
      </div>
    </>
  );
}
