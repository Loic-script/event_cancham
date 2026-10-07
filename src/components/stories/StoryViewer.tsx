"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/app/Avatar";
import { ChevronRightIcon, XIcon } from "@/components/app/icons";
import { StoryArt } from "./StoryArt";
import type { StoryView } from "./types";
import styles from "./stories.module.css";

type StoryViewerProps = {
  stories: StoryView[];
  startIndex: number;
  onClose: () => void;
};

const DURATION = 5000;
const REACTIONS = ["❤️", "👏", "🔥", "🥂"];

type Floating = { id: number; emoji: string; dx: string; rot: string; left: string };

// Visionneur plein écran : barres de progression, défilement automatique,
// zones tactiles gauche et droite, flèches du clavier, réactions.
export function StoryViewer({ stories, startIndex, onClose }: StoryViewerProps) {
  const [index, setIndex] = useState(startIndex);
  const [floating, setFloating] = useState<Floating[]>([]);
  // Compteur de réactions : sert d'identifiant et fait varier la trajectoire sans aléatoire.
  const reactionCount = useRef(0);
  const story = stories[index];

  const next = useCallback(() => {
    setIndex((i) => {
      if (i + 1 >= stories.length) {
        onClose();
        return i;
      }
      return i + 1;
    });
  }, [stories.length, onClose]);

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  // Passage automatique à la story suivante.
  useEffect(() => {
    const id = window.setTimeout(next, DURATION);
    return () => window.clearTimeout(id);
  }, [index, next]);

  // Clavier et verrouillage du défilement de la page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [next, prev, onClose]);

  function react(emoji: string) {
    reactionCount.current += 1;
    const n = reactionCount.current;
    const item: Floating = {
      id: n,
      emoji,
      dx: `${((n * 37) % 80) - 40}px`,
      rot: `${((n * 53) % 40) - 20}deg`,
      left: `${20 + ((n * 29) % 60)}%`,
    };
    setFloating((list) => [...list, item]);
    window.setTimeout(() => setFloating((list) => list.filter((f) => f.id !== n)), 1300);
  }

  return (
    <div className={styles.viewer} role="dialog" aria-modal="true" aria-label={`Story de ${story.authorName}`}>
      <div className={styles.frame}>
        <StoryArt key={story.id} image={story.image} theme={story.challenge.theme} hue={story.author.hue} seed={story.id} alt={story.caption ?? ""} />
        <div className={styles.shade} aria-hidden />

        <div className={styles.progress} aria-hidden>
          {stories.map((s, i) => (
            <span key={`${s.id}-${i === index ? "on" : "off"}`} className={i < index ? styles.progressDone : i === index ? styles.progressActive : undefined} style={{ "--dur": `${DURATION}ms` } as React.CSSProperties} />
          ))}
        </div>

        <header className="absolute inset-x-0 z-[3] flex items-center gap-3 px-3" style={{ top: "calc(22px + env(safe-area-inset-top))" }}>
          <Avatar person={story.author} size={38} className="ring-2 ring-white/80" />
          <div className="min-w-0 flex-1 text-white">
            <p className="truncate text-[14px] font-bold leading-tight drop-shadow">{story.authorName}</p>
            <p className="truncate text-[12px] text-white/80">{story.when} · Défi {story.challenge.number}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-black/35 text-white backdrop-blur hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <XIcon width={22} height={22} />
          </button>
        </header>

        <button type="button" className={`${styles.zone} ${styles.zonePrev}`} onClick={prev} aria-label="Story précédente" />
        <button type="button" className={`${styles.zone} ${styles.zoneNext}`} onClick={next} aria-label="Story suivante" />

        <div className="absolute inset-x-0 bottom-0 z-[3] flex flex-col gap-3 p-4" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}>
          <span className="w-fit rounded-full bg-black/45 px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-white backdrop-blur">
            Défi {story.challenge.number} · {story.challenge.title}
          </span>
          {story.caption ? <p className="text-[15px] font-medium leading-6 text-white drop-shadow">{story.caption}</p> : null}
          <div className="flex items-center gap-2">
            {REACTIONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => react(e)}
                aria-label={`Réagir ${e}`}
                className="grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-white/12 text-[22px] backdrop-blur transition-transform hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {e}
              </button>
            ))}
            {index + 1 < stories.length ? (
              <button type="button" onClick={next} className="ml-auto inline-flex h-11 cursor-pointer items-center gap-1 rounded-full bg-white/12 px-4 text-[13px] font-semibold text-white backdrop-blur hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                Suivante
                <ChevronRightIcon width={16} height={16} />
              </button>
            ) : null}
          </div>
        </div>

        {floating.map((f) => (
          <span key={f.id} className={styles.reaction} style={{ left: f.left, "--dx": f.dx, "--rot": f.rot } as React.CSSProperties} aria-hidden>
            {f.emoji}
          </span>
        ))}
      </div>
    </div>
  );
}
