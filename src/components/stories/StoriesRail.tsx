"use client";

import { useRef, useState } from "react";
import { Avatar } from "@/components/app/Avatar";
import { ArrowLeftIcon, ChevronRightIcon } from "@/components/app/icons";
import { StoryArt } from "./StoryArt";
import { StoryViewer } from "./StoryViewer";
import type { StoryView } from "./types";
import styles from "./stories.module.css";

type StoriesRailProps = {
  stories: StoryView[];
};

// Bandeau de stories façon réseau social : les photos de défi des participants.
// Un toucher ouvre le visionneur plein écran.
export function StoriesRail({ stories }: StoriesRailProps) {
  const scroller = useRef<HTMLUListElement | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [edge, setEdge] = useState<"start" | "end" | "middle">("start");

  function scrollBy(direction: 1 | -1) {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  function onScroll() {
    const el = scroller.current;
    if (!el) return;
    const atStart = el.scrollLeft <= 4;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    setEdge(atStart ? "start" : atEnd ? "end" : "middle");
  }

  return (
    <div className={styles.rail}>
      <button type="button" onClick={() => scrollBy(-1)} aria-label="Stories précédentes" className={`${styles.arrow} ${styles.arrowLeft} ${edge === "start" ? styles.arrowHidden : ""}`}>
        <ArrowLeftIcon width={20} height={20} />
      </button>
      <button type="button" onClick={() => scrollBy(1)} aria-label="Stories suivantes" className={`${styles.arrow} ${styles.arrowRight} ${edge === "end" ? styles.arrowHidden : ""}`}>
        <ChevronRightIcon width={22} height={22} />
      </button>

      <ul ref={scroller} onScroll={onScroll} className={styles.scroller} aria-label="Stories des défis">
        {stories.map((s, i) => (
          <li key={s.id} className={styles.item}>
            <button type="button" onClick={() => setOpen(i)} className={styles.story} aria-label={`Story de ${s.authorName}, défi ${s.challenge.number}`}>
              <StoryArt image={s.image} theme={s.challenge.theme} hue={s.author.hue} seed={s.id} />
              <span className={styles.shade} aria-hidden />
              <span className={styles.ring}><span><Avatar person={s.author} size={34} /></span></span>
              <span className={styles.tag}>Défi {s.challenge.number}</span>
              <span className={styles.name}>{s.authorName}</span>
            </button>
          </li>
        ))}
      </ul>

      {open !== null ? <StoryViewer stories={stories} startIndex={open} onClose={() => setOpen(null)} /> : null}
    </div>
  );
}
