"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./auth.module.css";

const SLIDES = [
  { name: "groupe", position: "50% 55%" },
  { name: "musique", position: "35% 40%" },
  { name: "reseautage", position: "55% 40%" },
  { name: "signature", position: "65% 45%" },
  { name: "accueil", position: "40% 50%" },
  { name: "equipe", position: "60% 50%" },
];

const INTERVAL = 5000;

export function PanelSlideshow() {
  const [step, setStep] = useState({ index: 0, mounted: 2 });

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: number | undefined;

    const stop = () => {
      window.clearInterval(timer);
      timer = undefined;
    };

    const sync = () => {
      stop();
      if (motion.matches || document.hidden) return;
      timer = window.setInterval(() => {
        setStep(({ index, mounted }) => {
          const next = (index + 1) % SLIDES.length;
          return { index: next, mounted: Math.min(SLIDES.length, Math.max(mounted, next + 2)) };
        });
      }, INTERVAL);
    };

    sync();
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      stop();
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <div className={styles.slides} aria-hidden>
      {SLIDES.slice(0, step.mounted).map((slide, i) => (
        <Image
          key={slide.name}
          src={`/connexion/fonds/${slide.name}.jpg`}
          alt=""
          fill
          sizes="(max-width: 1023px) 110vw, 90vw"
          preload={i === 0}
          className={`${styles.slide} ${i === step.index ? styles.slideActive : ""}`}
          style={{ objectPosition: slide.position }}
        />
      ))}
    </div>
  );
}
