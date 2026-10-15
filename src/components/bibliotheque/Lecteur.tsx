"use client";

import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import type { Bloc } from "@/lib/ressources/blocs";
import type { Format } from "@/lib/ressources/types";
import { BlocsRendu } from "./Blocs";
import styles from "./bibliotheque.module.css";

const TOUCHES = new Set(["s", "p", "c", "a", "x", "u"]);

function PageProtegee({ id, n, total }: { id: string; n: number; total: number }) {
  const [charger, setCharger] = useState(n <= 2);
  const [chargee, setChargee] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (charger || !ref.current) return;
    const obs = new IntersectionObserver(
      (entrees) => {
        if (entrees.some((e) => e.isIntersecting)) {
          setCharger(true);
          obs.disconnect();
        }
      },
      { rootMargin: "900px 0px" },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [charger]);

  return (
    <div ref={ref} className={`${styles.page} ${chargee ? "" : styles.pageAttente}`}>
      {charger ? <img src={`/api/ressources/${id}/pages/${n}`} alt={`Page ${n} sur ${total}`} draggable={false} onLoad={() => setChargee(true)} decoding="async" /> : null}
      <span className={styles.numPage}>
        {n} / {total}
      </span>
    </div>
  );
}

type Props = { id: string; format: Format; pages: number; blocs: Bloc[] | null };

export function Lecteur({ id, format, pages, blocs }: Props) {
  const [flou, setFlou] = useState(false);

  useEffect(() => {
    let minuteur: number | undefined;
    const masquer = () => setFlou(true);
    const montrer = () => setFlou(false);
    const visibilite = () => setFlou(document.visibilityState === "hidden");
    const touches = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && TOUCHES.has(k)) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.key === "PrintScreen" || e.key === "Snapshot") {
        setFlou(true);
        navigator.clipboard?.writeText("").catch(() => undefined);
        window.clearTimeout(minuteur);
        minuteur = window.setTimeout(() => setFlou(!document.hasFocus()), 1600);
      }
    };
    window.addEventListener("blur", masquer);
    window.addEventListener("focus", montrer);
    window.addEventListener("beforeprint", masquer);
    window.addEventListener("afterprint", montrer);
    document.addEventListener("visibilitychange", visibilite);
    window.addEventListener("keydown", touches, true);
    window.addEventListener("keyup", touches, true);
    return () => {
      window.clearTimeout(minuteur);
      window.removeEventListener("blur", masquer);
      window.removeEventListener("focus", montrer);
      window.removeEventListener("beforeprint", masquer);
      window.removeEventListener("afterprint", montrer);
      document.removeEventListener("visibilitychange", visibilite);
      window.removeEventListener("keydown", touches, true);
      window.removeEventListener("keyup", touches, true);
    };
  }, []);

  const bloquer = (e: SyntheticEvent) => e.preventDefault();

  let contenu: React.ReactNode;
  if (format === "video") {
    contenu = (
      <video
        className={styles.video}
        src={`/api/ressources/${id}/video`}
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        disableRemotePlayback
        playsInline
        preload="metadata"
      />
    );
  } else if (format === "page") {
    contenu = (
      <div className={styles.pageComposee}>
        {blocs && blocs.length ? <BlocsRendu blocs={blocs} fichier={(nom) => `/api/ressources/${id}/blocs/${nom}`} /> : <p className="text-graphite-muted">Cette page n’a pas encore de contenu.</p>}
      </div>
    );
  } else if (pages > 0) {
    contenu = (
      <div className={styles.pages}>
        {Array.from({ length: pages }, (_, i) => (
          <PageProtegee key={i + 1} id={id} n={i + 1} total={pages} />
        ))}
      </div>
    );
  } else {
    contenu = <p className="rounded-2xl border border-line bg-surface p-6 text-graphite-muted">Le contenu de cette ressource n’est pas disponible pour le moment.</p>;
  }

  return (
    <div className={`${styles.lecteur} ${flou ? styles.lecteurFlou : ""}`} onContextMenu={bloquer} onDragStart={bloquer} onCopy={bloquer} onCut={bloquer} onSelect={bloquer}>
      {contenu}
      {flou ? (
        <div className={styles.voileFlou} aria-live="polite">
          <span>Contenu masqué. Revenez sur la page pour reprendre la lecture.</span>
        </div>
      ) : null}
    </div>
  );
}
