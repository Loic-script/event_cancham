"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ExternalLinkIcon, FacebookIcon, InstagramIcon } from "@/components/app/icons";
import { AvatarInitiales } from "../ui";
import styles from "./classement.module.css";

export type EntreeClassement = { id?: string; nom: string; r: number; moi: boolean; photo?: string; initiales?: string; sous?: string; lien?: string; reseau?: "facebook" | "instagram" | null };

export function LienPublication({ e, compact = false }: { e: EntreeClassement; compact?: boolean }) {
  if (!e.lien) return null;
  const icone = e.reseau === "instagram" ? <InstagramIcon width={15} height={15} /> : e.reseau === "facebook" ? <FacebookIcon width={15} height={15} /> : <ExternalLinkIcon width={14} height={14} />;
  return (
    <a
      href={e.lien}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.lienPub} ${compact ? styles.lienCompact : ""} ${e.reseau ? styles[e.reseau] : ""}`}
      aria-label={`Voir la publication de ${e.nom}`}
      title="Voir la publication"
    >
      {icone}
      {compact ? null : <span>Voir la publication</span>}
    </a>
  );
}

function Compteur({ valeur }: { valeur: number }) {
  const [affiche, setAffiche] = useState(valeur);
  const [precedent, setPrecedent] = useState(valeur);
  const [bulle, setBulle] = useState<{ n: number; cle: number } | null>(null);
  const depart = useRef(valeur);

  if (valeur !== precedent) {
    setPrecedent(valeur);
    if (valeur > precedent) setBulle({ n: valeur - precedent, cle: valeur });
  }

  useEffect(() => {
    const debut = depart.current;
    if (debut === valeur) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      depart.current = valeur;
      const id = requestAnimationFrame(() => setAffiche(valeur));
      return () => cancelAnimationFrame(id);
    }
    const t0 = performance.now();
    let id = 0;
    const pas = (t: number) => {
      const p = Math.min(1, (t - t0) / 700);
      const v = Math.round(debut + (valeur - debut) * (1 - Math.pow(1 - p, 3)));
      setAffiche(v);
      depart.current = v;
      if (p < 1) id = requestAnimationFrame(pas);
    };
    id = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(id);
  }, [valeur]);

  return (
    <span className={styles.compteur}>
      <b>{affiche.toLocaleString("fr-FR")}</b>
      {bulle ? (
        <i key={bulle.cle} className={styles.bulle} aria-hidden>
          +{bulle.n}
        </i>
      ) : null}
    </span>
  );
}

function Couronne() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" className={styles.couronne} aria-hidden>
      <path d="M3 8.5 7.5 12 12 5l4.5 7L21 8.5 19 18H5z" fill="currentColor" stroke="rgba(0,0,0,.18)" strokeWidth="0.8" strokeLinejoin="round" />
      <circle cx="3" cy="8" r="1.6" fill="currentColor" />
      <circle cx="12" cy="4.4" r="1.6" fill="currentColor" />
      <circle cx="21" cy="8" r="1.6" fill="currentColor" />
    </svg>
  );
}

const MEDAILLES = ["or", "argent", "bronze"] as const;

const nomAffiche = (e: EntreeClassement) => (e.moi ? e.nom.replace(/\s*\(vous\)$/i, "") : e.nom);

const RANGS = ["r1", "r2", "r3"] as const;

type ClassementProps = { entrees: EntreeClassement[]; total?: number; avecPodium?: boolean; actions?: (e: EntreeClassement) => ReactNode };

export function Classement({ entrees, total, avecPodium = true, actions }: ClassementProps) {
  const max = Math.max(1, ...entrees.map((e) => e.r));
  const decalage = avecPodium ? 3 : 0;
  const podium = entrees.slice(0, decalage);
  const suite = entrees.slice(decalage);
  const iMoi = entrees.findIndex((e) => e.moi);
  const moi = iMoi >= 0 ? entrees[iMoi] : null;
  const devant = iMoi > 0 ? entrees[iMoi - 1] : null;

  const lignes = useRef(new Map<string, HTMLElement>());
  const positions = useRef(new Map<string, number>());
  const ordre = entrees.map((e) => e.nom).join("|");

  useLayoutEffect(() => {
    const calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nouvelles = new Map<string, number>();
    lignes.current.forEach((el, cle) => {
      const haut = el.getBoundingClientRect().top;
      nouvelles.set(cle, haut);
      const avant = positions.current.get(cle);
      if (calme || avant === undefined || Math.abs(avant - haut) < 1) return;
      el.style.transition = "none";
      el.style.transform = `translateY(${avant - haut}px)`;
      requestAnimationFrame(() => {
        el.style.transition = "transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)";
        el.style.transform = "";
      });
    });
    positions.current = nouvelles;
  }, [ordre]);

  const enregistrer = (cle: string) => (el: HTMLElement | null) => {
    if (el) lignes.current.set(cle, el);
    else lignes.current.delete(cle);
  };

  return (
    <div className={`${styles.classement} ${avecPodium ? "" : styles.sansPodium}`}>
      {podium.length ? (
        <ol className={styles.podium} aria-label="Podium">
          {podium.map((e, i) => (
            <li key={e.nom} className={`${styles.marche} ${styles[`place${i + 1}`]} ${e.moi ? styles.moi : ""}`} style={{ "--i": i } as CSSProperties}>
              <div className={styles.gagnant}>
                {i === 0 ? <Couronne /> : null}
                <span className={`${styles.medaille} ${styles[MEDAILLES[i]]}`}>
                  <AvatarInitiales nom={e.initiales ?? e.nom} photo={e.photo} size={i === 0 ? 76 : 62} className={styles.avatarPodium} />
                  <em>{i + 1}</em>
                </span>
                <strong title={nomAffiche(e)}>{nomAffiche(e)}</strong>
                {e.sous ? <small className={styles.sous}>{e.sous}</small> : null}
                {e.moi ? <span className={styles.vous}>Vous</span> : null}
                <Compteur valeur={e.r} />
                <small>réactions</small>
                <LienPublication e={e} />
              </div>
              <div className={styles.socle}>
                <span>{i + 1}</span>
              </div>
            </li>
          ))}
        </ol>
      ) : null}

      {moi ? (
        <p className={styles.position} role="status">
          <span className={styles.pastille}>{iMoi + 1}</span>
          {iMoi === 0 ? (
            <span>
              <b>Vous êtes en tête du classement !</b> Continuez à partager votre publication pour garder la première place.
            </span>
          ) : (
            <span>
              Vous êtes <b>{iMoi + 1}e</b>. Plus que <b>{(devant!.r - moi.r + 1).toLocaleString("fr-FR")} réaction{devant!.r - moi.r + 1 > 1 ? "s" : ""}</b> pour passer devant {devant!.nom}.
            </span>
          )}
        </p>
      ) : null}

      {suite.length ? (
        <ol className={styles.liste} start={decalage + 1}>
          {suite.map((e, j) => {
            const i = j + decalage;
            return (
              <li key={e.nom} ref={enregistrer(e.nom)} className={`${styles.ligne} ${e.moi ? styles.moi : ""} ${actions ? styles.avecActions : ""}`} style={{ "--i": j } as CSSProperties}>
                <span className={`${styles.rang} ${i < 3 ? styles[RANGS[i]] : ""}`}>{i + 1}</span>
                <AvatarInitiales nom={e.initiales ?? e.nom} photo={e.photo} size={40} className={e.moi ? styles.avatarMoi : ""} />
                <div className={styles.corps}>
                  <div className={styles.tete}>
                    <strong title={nomAffiche(e)}>{nomAffiche(e)}</strong>
                    {e.moi ? <span className={styles.vous}>Vous</span> : null}
                    {e.sous ? <small className={styles.sousLigne}>{e.sous}</small> : null}
                  </div>
                  <div className={styles.barre} aria-hidden>
                    <i style={{ width: `${Math.max(4, Math.round((e.r / max) * 100))}%` }} />
                  </div>
                </div>
                <div className={styles.score}>
                  <Compteur valeur={e.r} />
                  <small>réactions</small>
                </div>
                {actions ? <div className={styles.actions}>{actions(e)}</div> : <LienPublication e={e} compact />}
              </li>
            );
          })}
        </ol>
      ) : null}
      {total ? <p className={styles.total}>{total.toLocaleString("fr-FR")} réactions au total sur les publications « J’y serai »</p> : null}
    </div>
  );
}
