"use client";

import { useState } from "react";
import { PlayIcon, PlusIcon } from "@/components/app/icons";
import { useProfile } from "@/components/profile/useProfile";
import { IMG } from "@/lib/traversee/data";
import { setTraversee, toast, uid, useTraversee } from "@/lib/traversee/store";
import { fullName } from "@/lib/mock/data";
import { Btn, Card, FileBtn, PageHead, Puce, Recherche, Sur, Vide, ui } from "../ui";
import styles from "./livre.module.css";

export function Livre() {
  const s = useTraversee();
  const me = useProfile();
  const [q, setQ] = useState("");
  const [pl, setPl] = useState(0);
  const [anim, setAnim] = useState<"" | "tourneAv" | "tourneAr" | "arriveAv" | "arriveAr">("");
  const valides = s.livre.filter((l) => l.etat === "valide");
  const n = valides.length;
  const i = Math.min(pl, Math.max(0, n - 1));
  const p = valides[i];
  const miens = s.livre.filter((l) => l.moi && l.etat !== "valide");

  function tourner(sens: 1 | -1) {
    const calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (calme) {
      setPl(i + sens);
      return;
    }
    setAnim(sens > 0 ? "tourneAv" : "tourneAr");
    window.setTimeout(() => {
      setPl(i + sens);
      setAnim(sens > 0 ? "arriveAv" : "arriveAr");
      window.setTimeout(() => setAnim(""), 420);
    }, 330);
  }

  function chercher(v: string) {
    setQ(v);
    const ql = v.toLowerCase().trim();
    if (!ql) return;
    const k = valides.findIndex((l) => `${l.nom} ${l.texte}`.toLowerCase().includes(ql));
    if (k >= 0 && k !== i) setPl(k);
  }

  return (
    <>
      <PageHead title="Livre d’or" accent="vidéo" text="Feuilletez les souvenirs des participants, page après page. Chaque vidéo est sous-titrée automatiquement." photo="musique" />
      <div className={ui.outils}>
        <Recherche value={q} onChange={chercher} placeholder="Rechercher un mot dans les souvenirs…" label="Rechercher dans les souvenirs" className={ui.recherche} />
        <Puce tone="grey">
          {n} souvenir{n > 1 ? "s" : ""}
        </Puce>
      </div>
      {p ? (
        <div className={styles.livre}>
          <div className={`${styles.pages} ${anim ? styles[anim] : ""} m-bleed`}>
            <div className={`${styles.page} ${styles.pg}`}>
              <div className={styles.media}>
                {p.vid ? (
                  <video controls src={p.vid} />
                ) : (
                  <>
                    <img src={IMG(p.img)} alt="" />
                    <span className={styles.jouer}>
                      <PlayIcon fill="currentColor" strokeWidth={0} />
                    </span>
                  </>
                )}
                <span className={styles.duree}>{p.duree}</span>
              </div>
            </div>
            <div className={`${styles.page} ${styles.pd}`}>
              <Sur>
                Souvenir {i + 1} sur {n}
              </Sur>
              <h3>{p.nom}</h3>
              <blockquote>« {p.texte} »</blockquote>
              <div>
                <Puce>Sous-titres automatiques</Puce>
              </div>
            </div>
          </div>
          <div className={styles.nav}>
            <Btn disabled={i === 0 || anim !== ""} onClick={() => tourner(-1)}>
              ← Page précédente
            </Btn>
            <span>
              {i + 1} / {n}
            </span>
            <Btn variant="primary" disabled={i >= n - 1 || anim !== ""} onClick={() => tourner(1)}>
              Tourner la page →
            </Btn>
          </div>
        </div>
      ) : (
        <Vide>Le livre d’or est encore vide.</Vide>
      )}
      <Card pad bleed className="mt-5 grid gap-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3.5">
          <div>
            <Sur className="!mb-1.5">Votre souvenir</Sur>
            <strong className="text-graphite">Ajoutez votre page au livre d’or</strong>
            <p className="text-graphite-muted">Votre vidéo est sous-titrée automatiquement, puis publiée après validation par l’équipe CanCham.</p>
          </div>
          <FileBtn
            variant="primary"
            label={
              <>
                <PlusIcon width={16} height={16} />
                Ajouter ma vidéo
              </>
            }
            accept="video/*"
            aria-label="Ajouter ma vidéo souvenir"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const vid = URL.createObjectURL(f);
              setTraversee((st) => ({ livre: [...st.livre, { id: uid("m"), img: "accueil", vid, duree: "Votre vidéo", nom: fullName(me), texte: "Sous-titres en cours de génération.", etat: "attente", moi: true }] }));
              toast("Vidéo envoyée. Elle sera publiée après validation par l’équipe.");
            }}
          />
        </div>
        {miens.length ? (
          <ul className={ui.liste}>
            {miens.map((l) => (
              <li key={l.id}>
                <Puce tone={l.etat === "refuse" ? "grey" : "red"}>{l.etat === "refuse" ? "Non retenue" : "En attente de validation"}</Puce>
                <div className="min-w-0 flex-1">
                  <strong>Votre vidéo</strong>
                  <small>{l.duree}</small>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>
    </>
  );
}
