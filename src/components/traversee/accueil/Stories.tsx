"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "@/components/app/icons";
import { IMG, SIGLE } from "@/lib/traversee/data";
import { toutesStories } from "@/lib/traversee/galerie";
import { setTraversee, toast, useTraversee } from "@/lib/traversee/store";
import styles from "./accueil.module.css";

type StoriesProps = { admin?: boolean; onCreer?: () => void };

export function Stories({ admin = false, onCreer }: StoriesProps) {
  const etat = useTraversee();
  const { storiesVues } = etat;
  const stories = useMemo(() => toutesStories(etat), [etat]);
  const [ouverte, setOuverte] = useState<number | null>(null);
  const rail = useRef<HTMLDivElement | null>(null);
  const plein = useRef(false);
  const [bord, setBord] = useState<"debut" | "milieu" | "fin">("debut");

  const pleinEcran = useCallback((actif: boolean) => {
    if (actif) {
      const racine = document.documentElement;
      if (document.fullscreenElement || !racine.requestFullscreen || !window.matchMedia("(max-width: 1023px)").matches) return;
      racine
        .requestFullscreen({ navigationUI: "hide" })
        .then(() => {
          plein.current = true;
        })
        .catch(() => undefined);
      return;
    }
    if (!plein.current) return;
    plein.current = false;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
  }, []);

  useEffect(() => {
    const surChange = () => {
      if (document.fullscreenElement || !plein.current) return;
      plein.current = false;
      setOuverte(null);
    };
    document.addEventListener("fullscreenchange", surChange);
    return () => {
      document.removeEventListener("fullscreenchange", surChange);
      pleinEcran(false);
    };
  }, [pleinEcran]);

  function defiler(sens: 1 | -1) {
    const el = rail.current;
    if (!el) return;
    el.scrollBy({ left: sens * el.clientWidth * 0.8, behavior: "smooth" });
  }

  function surScroll() {
    const el = rail.current;
    if (!el) return;
    const fin = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    setBord(el.scrollLeft <= 4 ? "debut" : fin ? "fin" : "milieu");
  }

  const fermer = useCallback(() => {
    setOuverte(null);
    pleinEcran(false);
  }, [pleinEcran]);
  const montrer = useCallback(
    (i: number) => {
      if (i < 0) i = 0;
      if (i >= stories.length) {
        fermer();
        return;
      }
      const s = stories[i];
      setTraversee((st) => ({ storiesVues: { ...st.storiesVues, [s.id]: 1 } }));
      setOuverte(i);
    },
    [stories, fermer],
  );

  useEffect(() => {
    if (ouverte === null) return;
    const calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = calme ? null : window.setTimeout(() => montrer(ouverte + 1), 5000);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fermer();
      if (e.key === "ArrowRight") montrer(ouverte + 1);
      if (e.key === "ArrowLeft") montrer(ouverte - 1);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      if (id) window.clearTimeout(id);
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [ouverte, montrer, fermer]);

  const s = ouverte !== null ? stories[ouverte] : null;

  return (
    <>
      <div className={styles.rail}>
      <button type="button" onClick={() => defiler(-1)} aria-label="Stories précédentes" className={`${styles.fleche} ${styles.flecheG} ${bord === "debut" ? styles.flecheOff : ""}`}>
        <ChevronLeftIcon width={22} height={22} />
      </button>
      <button type="button" onClick={() => defiler(1)} aria-label="Stories suivantes" className={`${styles.fleche} ${styles.flecheD} ${bord === "fin" ? styles.flecheOff : ""}`}>
        <ChevronRightIcon width={22} height={22} />
      </button>
      <div ref={rail} onScroll={surScroll} className={styles.stories} aria-label="Stories">
        {admin ? (
          <button type="button" className={`${styles.story} ${styles.storyPlus}`} onClick={onCreer} style={{ "--i": 0 } as React.CSSProperties}>
            <span className={styles.hautC} style={{ backgroundImage: `url(${IMG("hero")})` }} />
            <span className={styles.rondC}>
              <PlusIcon width={20} height={20} />
            </span>
            <small>Créer une story</small>
          </button>
        ) : null}
        {stories.map((st, i) => (
          <button
            key={st.id}
            type="button"
            onClick={() => {
              pleinEcran(true);
              montrer(i);
            }}
            className={`${styles.story} ${storiesVues[st.id] ? styles.storyVue : ""}`}
            style={{ "--i": i + (admin ? 1 : 0), "--img": `url(${st.img})` } as React.CSSProperties}
            aria-label={st.auteur === "CanCham" ? "Voir la story de la CanCham" : "Voir la story d’un participant"}
          >
            <span className={styles.avatar}>
              {st.auteur === "CanCham" ? <img src={SIGLE} alt="" /> : <b>P</b>}
            </span>
            <small>{st.auteur}</small>
          </button>
        ))}
      </div>
      </div>

      {s && ouverte !== null ? (
        <div className={styles.voileSt} role="dialog" aria-modal="true" aria-label="Story">
          <div className={styles.stScene}>
          <button type="button" onClick={() => montrer(ouverte - 1)} disabled={ouverte === 0} aria-label="Story précédente" className={`${styles.stNav} ${styles.stNavG}`}>
            <ChevronLeftIcon width={24} height={24} />
          </button>
          <div key={s.id} className={styles.stCadre} style={{ "--img": `url(${s.img})` } as React.CSSProperties}>
            <img src={s.img} alt="" className={styles.stImage} />
            <div className={styles.stBarres} aria-hidden>
              {stories.map((x, k) => (
                <i key={x.id} className={k < ouverte ? "fait" : k === ouverte ? "cours" : ""} />
              ))}
            </div>
            <div className={styles.stTete}>
              <span className="grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-white p-1.5">
                <img src={SIGLE} alt="" className="h-full w-full object-contain" />
              </span>
              <strong>{s.auteur === "CanCham" ? "CanCham Madagascar" : "Participant"}</strong>
              <button type="button" onClick={fermer} aria-label="Fermer">
                ×
              </button>
            </div>
            <button type="button" className={`${styles.stZone} ${styles.stZoneG}`} onClick={() => montrer(ouverte - 1)} aria-label="Story précédente" />
            <button type="button" className={`${styles.stZone} ${styles.stZoneD}`} onClick={() => montrer(ouverte + 1)} aria-label="Story suivante" />
            {admin ? (
              <button
                type="button"
                onClick={() => {
                  const media = s.media;
                  setTraversee((st) => (media ? { galSupprimees: [...st.galSupprimees, media], galAjoutees: st.galAjoutees.filter((x) => x.id !== media) } : { stories: st.stories.filter((x) => x.id !== s.id) }));
                  fermer();
                  toast(media ? "Photo retirée des stories et de la galerie." : "Story supprimée.");
                }}
                className="relative z-[2] mt-3 h-10 w-fit cursor-pointer rounded-xl border border-white/30 bg-white/15 px-4 text-[13px] font-bold text-white backdrop-blur hover:bg-white/25"
              >
                Supprimer cette story
              </button>
            ) : null}
          </div>
          <button type="button" onClick={() => montrer(ouverte + 1)} disabled={ouverte >= stories.length - 1} aria-label="Story suivante" className={`${styles.stNav} ${styles.stNavD}`}>
            <ChevronRightIcon width={24} height={24} />
          </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
