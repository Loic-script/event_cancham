"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Avatar } from "@/components/app/Avatar";
import { ChevronLeftIcon, ChevronRightIcon, GlobeIcon, XIcon } from "@/components/app/icons";
import { StoryArt } from "./StoryArt";
import type { StoryView } from "./types";
import styles from "./stories.module.css";

type StoryViewerProps = {
  stories: StoryView[];
  startIndex: number;
  onClose: () => void;
};

const DURATION = 5000;

export function StoryViewer({ stories, startIndex, onClose }: StoryViewerProps) {
  const [index, setIndex] = useState(startIndex);
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

  useEffect(() => {
    const id = window.setTimeout(next, DURATION);
    return () => window.clearTimeout(id);
  }, [index, next]);

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

  return (
    <div className={styles.viewer} role="dialog" aria-modal="true" aria-label={`Story de ${story.authorName}`}>
      <button type="button" onClick={prev} disabled={index === 0} aria-label="Story précédente" className={`${styles.nav} ${styles.navPrev}`}>
        <ChevronLeftIcon width={24} height={24} />
      </button>

      <div className={styles.frame}>
        <StoryArt key={story.id} image={story.image} theme={story.challenge.theme} hue={story.author.hue} seed={story.id} alt={story.caption ?? ""} />
        <div className={styles.shade} aria-hidden />

        <div className={styles.progress} aria-hidden>
          {stories.map((s, i) => (
            <span key={`${s.id}-${i === index ? "on" : "off"}`} className={i < index ? styles.progressDone : i === index ? styles.progressActive : undefined} style={{ "--dur": `${DURATION}ms` } as React.CSSProperties} />
          ))}
        </div>

        <header className="absolute inset-x-0 z-[3] flex items-center gap-3 px-3" style={{ top: "calc(22px + env(safe-area-inset-top))" }}>
          <Avatar person={story.author} size={38} />
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

        {story.postId ? (
          <Link href={`/reseaux#${story.postId}`} className={styles.postLink}>
            <GlobeIcon width={18} height={18} />
            Voir la publication
          </Link>
        ) : null}
      </div>

      <button type="button" onClick={next} aria-label="Story suivante" className={`${styles.nav} ${styles.navNext}`}>
        <ChevronRightIcon width={24} height={24} />
      </button>
    </div>
  );
}
