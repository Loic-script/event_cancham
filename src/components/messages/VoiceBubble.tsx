"use client";

import { useMemo, useRef, useState } from "react";
import { PauseIcon, PlayIcon } from "@/components/app/icons";
import styles from "./messages.module.css";

type VoiceBubbleProps = {
  id: string;
  src: string;
  seconds: number;
  mine: boolean;
};

function formatSeconds(s: number) {
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function bars(seed: string, count = 28) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return Array.from({ length: count }, (_, i) => {
    const x = Math.sin(i * 12.9898 + h) * 43758.5453;
    return 0.22 + 0.78 * (x - Math.floor(x));
  });
}

export function VoiceBubble({ id, src, seconds, mine }: VoiceBubbleProps) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const heights = useMemo(() => bars(id), [id]);

  function toggle() {
    const el = audio.current;
    if (!el) return;
    if (playing) el.pause();
    else void el.play();
  }

  const remaining = playing ? Math.max(0, seconds * (1 - progress)) : seconds;

  return (
    <div className={styles.voice}>
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Mettre en pause" : "Écouter le message vocal"}
        className={`${styles.playBtn} ${mine ? "bg-white/20 text-white hover:bg-white/30" : "bg-palm text-white hover:bg-palm-deep"}`}
      >
        {playing ? <PauseIcon width={18} height={18} /> : <PlayIcon width={18} height={18} />}
      </button>
      <div className={`${styles.waveform} ${mine ? "text-white" : "text-palm-ink"}`} aria-hidden>
        {heights.map((h, i) => (
          <span key={i} style={{ height: `${h * 100}%`, opacity: i / heights.length <= progress ? 1 : 0.4 }} />
        ))}
      </div>
      <span className={`shrink-0 font-mono text-[11px] ${mine ? "text-white/85" : "text-graphite-muted"}`}>{formatSeconds(remaining)}</span>
      <audio
        ref={audio}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
        onTimeUpdate={(e) => setProgress(Math.min(1, e.currentTarget.currentTime / seconds))}
      />
    </div>
  );
}
