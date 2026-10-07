"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Avatar } from "@/components/app/Avatar";
import { ArrowLeftIcon, ChevronRightIcon, PlusIcon } from "@/components/app/icons";
import { useParticipations } from "@/components/challenges/useParticipation";
import { challenges } from "@/lib/mock/challenges";
import { StoryArt } from "./StoryArt";
import { StoryViewer } from "./StoryViewer";
import type { StoryView } from "./types";
import styles from "./stories.module.css";

type StoriesRailProps = {
  stories: StoryView[];
  me: { firstName: string; lastName: string; hue: number };
};

// Bandeau de stories façon réseau social : votre défi en premier, puis les
// photos des participants. Un toucher ouvre le visionneur plein écran.
export function StoriesRail({ stories, me }: StoriesRailProps) {
  const scroller = useRef<HTMLUListElement | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [edge, setEdge] = useState<"start" | "end" | "middle">("start");
  const mine = useParticipations();

  // Votre participation photo la plus récente devient votre story.
  const myStory: StoryView | null = (() => {
    const entry = Object.values(mine).find((p) => p?.photo);
    if (!entry) return null;
    const c = challenges.find((x) => x.slug === entry.slug)!;
    return {
      id: `mine-${entry.slug}`,
      author: { ...me, online: true },
      authorName: "Vous",
      challenge: { slug: c.slug, number: c.number, title: c.title, theme: c.theme },
      when: "votre participation",
      caption: entry.link ? "Votre photo publiée pour le défi." : "Votre photo pour le défi.",
      image: entry.photo,
    };
  })();

  const all = myStory ? [myStory, ...stories] : stories;

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
        <li className={styles.item}>
          {myStory ? (
            <button type="button" onClick={() => setOpen(0)} className={styles.story} aria-label="Votre story">
              <StoryArt image={myStory.image} theme={myStory.challenge.theme} hue={me.hue} seed={myStory.id} />
              <span className={styles.shade} aria-hidden />
              <span className={styles.ring}><span><Avatar person={me} size={34} /></span></span>
              <span className={styles.tag}>Défi {myStory.challenge.number}</span>
              <span className={styles.name}>Votre défi</span>
            </button>
          ) : (
            <Link href="/defis/jy-serai" className={`${styles.story} ${styles.mine}`} aria-label="Ajouter votre photo de défi">
              <span className="absolute inset-x-0 top-0 h-[58%] overflow-hidden">
                <span className="absolute inset-0 grid place-items-center">
                  <Avatar person={me} size={56} className="opacity-90" />
                </span>
              </span>
              <span className={styles.plus}><PlusIcon width={18} height={18} strokeWidth={2.5} /></span>
              <span className={`${styles.name} text-center`}>Votre défi</span>
            </Link>
          )}
        </li>

        {stories.map((s, i) => {
          const viewerIndex = myStory ? i + 1 : i;
          return (
            <li key={s.id} className={styles.item}>
              <button type="button" onClick={() => setOpen(viewerIndex)} className={styles.story} aria-label={`Story de ${s.authorName}, défi ${s.challenge.number}`}>
                <StoryArt image={s.image} theme={s.challenge.theme} hue={s.author.hue} seed={s.id} />
                <span className={styles.shade} aria-hidden />
                <span className={styles.ring}><span><Avatar person={s.author} size={34} /></span></span>
                <span className={styles.tag}>Défi {s.challenge.number}</span>
                <span className={styles.name}>{s.authorName}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {open !== null ? <StoryViewer stories={all} startIndex={open} onClose={() => setOpen(null)} /> : null}
    </div>
  );
}
