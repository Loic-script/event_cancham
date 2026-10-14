"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ANNUAIRE, CRENEAUX, IMG, LIEUX, initiales, personnes } from "@/lib/traversee/data";
import { useTraversee } from "@/lib/traversee/store";
import { Btn, Card, PageHead, Puce, Recherche, Sur, ui } from "../ui";
import { RdvModal } from "./RdvModal";
import styles from "./annuaire.module.css";

const PERSONNES = personnes();
const SECTEURS = [...new Set(ANNUAIRE.map((x) => x.secteur))].sort();

function Liste({ admin = false }: { admin?: boolean }) {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [secteur, setSecteur] = useState("");
  const [rdv, setRdv] = useState<string | null>(null);
  const s = useTraversee();
  const actifs = s.rdv.filter((r) => r.etat === "confirme" || r.etat === "attente");
  const ql = q.toLowerCase().trim();
  const liste = PERSONNES.filter((p) => (!ql || `${p.nom} ${p.ent} ${p.role} ${p.sect}`.toLowerCase().includes(ql)) && (!secteur || p.sect === secteur));

  return (
    <>
      {!admin && actifs.length ? (
        <Card pad bleed className="mb-4">
          <Sur>Mes rendez-vous du 18 décembre</Sur>
          <ul className={ui.liste}>
            {actifs.map((r) => (
              <li key={r.id}>
                <Puce>{CRENEAUX[r.ci]}</Puce>
                <div className="min-w-0 flex-1">
                  <strong>{r.avec}</strong>
                  <small>{LIEUX[r.li].nom}</small>
                </div>
                <Puce tone={r.etat === "attente" ? "red" : "green"}>{r.etat === "attente" ? "En attente" : "Confirmé"}</Puce>
              </li>
            ))}
          </ul>
          <Btn href="/rdv" className="mt-3">
            Gérer mes rendez-vous
          </Btn>
        </Card>
      ) : null}
      <div className={ui.outils}>
        <Recherche value={q} onChange={setQ} placeholder="Rechercher par nom, entreprise, rôle ou secteur…" label="Rechercher dans l’annuaire" className={ui.recherche} />
        <select className={ui.saisie} style={{ width: "auto" }} value={secteur} onChange={(e) => setSecteur(e.target.value)} aria-label="Secteur">
          <option value="">Tous les secteurs</option>
          {SECTEURS.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>
      {liste.length ? (
        <div className={`${styles.fiches} ${ui.stagger}`}>
          {liste.map((p, i) => (
            <Card key={p.nom} className={styles.fiche} style={{ "--i": Math.min(i, 8) } as React.CSSProperties}>
              <div className={styles.bandeau} style={{ backgroundImage: `linear-gradient(120deg, rgba(15,29,44,.78), rgba(22,50,84,.45)), url(${IMG(p.img)})` }} />
              <div className={styles.corps}>
                <div className={styles.lg}>{initiales(p.nom)}</div>
                <h3>{p.nom}</h3>
                <p className={styles.ent}>{p.ent}</p>
                <p className={styles.role}>{p.role}</p>
                <div>
                  <Puce>{p.sect}</Puce>
                </div>
                <p>{p.act}</p>
                <div className={styles.actions}>
                  {admin ? (
                    <>
                      <Btn small variant="primary" href="/admin/messagerie">
                        Écrire
                      </Btn>
                      <Puce tone="green">Billet payé</Puce>
                    </>
                  ) : (
                    <>
                      <Btn small variant="primary" href="/messages">
                        Écrire
                      </Btn>
                      <Btn small onClick={() => setRdv(`${p.nom} · ${p.ent}`)}>
                        Rendez-vous
                      </Btn>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <p className={ui.vide}>Aucun participant ne correspond.</p>
      )}
      {rdv ? <RdvModal nom={rdv} onClose={() => setRdv(null)} /> : null}
    </>
  );
}

export function Annuaire({ admin = false }: { admin?: boolean }) {
  return (
    <>
      {admin ? (
        <PageHead title="Participants" accent="inscrits" text="La même vue que l’annuaire des participants. Liste d’exemple : la vraie liste viendra de la billetterie." photo="reseau">
          <Puce tone="white">{PERSONNES.length} inscrits</Puce>
        </PageHead>
      ) : (
        <PageHead title="Annuaire des" accent="participants" text="Chaque participant avec son entreprise, son rôle et l’activité de l’entreprise." photo="reseau" />
      )}
      <Suspense fallback={null}>
        <Liste admin={admin} />
      </Suspense>
    </>
  );
}
