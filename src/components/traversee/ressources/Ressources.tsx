"use client";

import { useState } from "react";
import { DownloadIcon, FolderIcon } from "@/components/app/icons";
import { setTraversee, toast, useTraversee } from "@/lib/traversee/store";
import { Btn, Card, Onglets, PageHead, Puce, Recherche, Vide, ui } from "../ui";
import styles from "./ressources.module.css";

const TYPES = ["PDF", "Image", "Vidéo", "Lien"];

export function RessourcesVue({ admin = false }: { admin?: boolean }) {
  const s = useTraversee();
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [tri, setTri] = useState<"date" | "nom">("date");
  const [vue, setVue] = useState<"grille" | "liste">("grille");
  const [dossier, setDossier] = useState("");
  const ql = q.toLowerCase().trim();
  const liste = s.ress
    .filter((r) => (!type || r.type === type) && (!dossier || r.dossier === dossier) && (!ql || `${r.nom} ${r.dossier}`.toLowerCase().includes(ql)))
    .sort(tri === "nom" ? (a, b) => (a.nom < b.nom ? -1 : 1) : (a, b) => b.date - a.date);

  function action(r: (typeof s.ress)[number]) {
    return (
      <div className="flex flex-wrap gap-2">
        {r.type === "Image" && !admin ? (
          <Btn small variant="primary" href="/defis/tombola">
            Ouvrir
          </Btn>
        ) : (
          <Btn small onClick={() => toast("Document d’exemple : aucun fichier n’est encore déposé.")}>
            <DownloadIcon width={15} height={15} />
            Télécharger
          </Btn>
        )}
        {admin ? (
          <Btn
            small
            onClick={() => {
              setTraversee((st) => ({ ress: st.ress.filter((x) => x.nom !== r.nom) }));
              toast("Ressource supprimée.");
            }}
          >
            Supprimer
          </Btn>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className={ui.outils}>
        <Recherche value={q} onChange={setQ} placeholder="Rechercher un document, un dossier…" label="Rechercher une ressource" className={ui.recherche} />
        <select className={ui.saisie} style={{ width: "auto" }} value={type} onChange={(e) => setType(e.target.value)} aria-label="Type">
          <option value="">Tous les types</option>
          {TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select className={ui.saisie} style={{ width: "auto" }} value={tri} onChange={(e) => setTri(e.target.value as "date" | "nom")} aria-label="Tri">
          <option value="date">Date de modification</option>
          <option value="nom">Nom</option>
        </select>
        <Onglets
          items={[
            { v: "grille", label: "▦ Grille" },
            { v: "liste", label: "☰ Liste" },
          ]}
          value={vue}
          onChange={setVue}
          label="Affichage"
        />
      </div>
      <h3 className="mb-3 flex flex-wrap items-center gap-2 font-display text-[16px] text-graphite">
        Dossiers <Puce tone="grey">{s.dossiers.length}</Puce>
        {dossier ? (
          <Btn small onClick={() => setDossier("")} className="!min-h-[30px] !px-2.5 !text-[11px]">
            Tous les dossiers
          </Btn>
        ) : null}
      </h3>
      <div className={styles.dossiers}>
        {s.dossiers.map((d) => {
          const n = s.ress.filter((r) => r.dossier === d.nom).length;
          return (
            <Card key={d.nom} className={`${styles.dossier} ${dossier === d.nom ? styles.ouvert : ""}`}>
              <span className={styles.ic}>
                <FolderIcon />
              </span>
              <button type="button" className={styles.nomd} onClick={() => setDossier(dossier === d.nom ? "" : d.nom)}>
                <strong>{d.nom}</strong>
                <small>
                  {n} ressource{n > 1 ? "s" : ""}
                </small>
                <small>{d.acces}</small>
              </button>
              {admin ? (
                <Btn
                  small
                  className="!min-h-[30px] !px-2.5 !text-[11px]"
                  onClick={() => {
                    if (n) return toast("Ce dossier contient encore des ressources.");
                    setTraversee((st) => ({ dossiers: st.dossiers.filter((x) => x.nom !== d.nom) }));
                    toast("Dossier supprimé.");
                  }}
                >
                  Supprimer
                </Btn>
              ) : (
                <span aria-hidden className="text-graphite-faint">
                  ›
                </span>
              )}
            </Card>
          );
        })}
      </div>
      <h3 className="mb-3 font-display text-[16px] text-graphite">
        Documents{dossier ? ` · ${dossier}` : ""} <Puce tone="grey">{liste.length}</Puce>
      </h3>
      {liste.length ? (
        vue === "grille" ? (
          <div className={`${styles.docs} ${ui.stagger}`}>
            {liste.map((r, i) => (
              <Card key={r.nom} pad className={styles.doc} style={{ "--i": i } as React.CSSProperties}>
                <span className={styles.icDoc}>{r.type}</span>
                <strong>{r.nom}</strong>
                <small>{r.dossier}</small>
                {action(r)}
              </Card>
            ))}
          </div>
        ) : (
          <Card bleed className={ui.defile}>
            <table className={ui.tab}>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Type</th>
                  <th>Dossier</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {liste.map((r) => (
                  <tr key={r.nom}>
                    <td>
                      <strong className="text-graphite">{r.nom}</strong>
                    </td>
                    <td>
                      <Puce tone="grey">{r.type}</Puce>
                    </td>
                    <td>{r.dossier}</td>
                    <td className="text-right">{action(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )
      ) : (
        <Vide>Aucun document ne correspond.</Vide>
      )}
    </>
  );
}

export function Ressources() {
  return (
    <>
      <PageHead title="Vos" accent="ressources" text="Les documents utiles pour préparer votre venue." photo="formation" />
      <RessourcesVue />
    </>
  );
}
