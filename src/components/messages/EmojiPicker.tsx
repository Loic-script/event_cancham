"use client";

import { useEffect, useRef } from "react";
import styles from "./messages.module.css";

type EmojiPickerProps = {
  onPick: (emoji: string) => void;
  onClose: () => void;
};

const GROUPS: { label: string; emojis: string[] }[] = [
  { label: "Humeurs", emojis: ["😀", "😂", "🤣", "😊", "😍", "🥰", "😎", "🤩", "😅", "😉", "😇", "🙂", "😘", "🤔", "😢", "😭", "😡", "🥳", "😴", "🤗", "😏", "🙃", "😋", "🤭"] },
  { label: "Gestes", emojis: ["👍", "👏", "🙏", "🤝", "💪", "👋", "✌️", "🤞", "👌", "🙌", "👀", "🤙"] },
  { label: "Cœurs", emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🤍", "💔", "💯", "✨", "💫", "⭐"] },
  { label: "Gala", emojis: ["🎉", "🎊", "🥂", "🍾", "🎤", "🎶", "🏆", "🥇", "🎁", "🎈", "🍽️", "🕺", "💃", "📸", "🎟️", "🌟", "🔥", "🇲🇬", "🇨🇦", "🌴", "🍁", "🤵", "👗", "🎺"] },
];

export function EmojiPicker({ onPick, onClose }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div ref={ref} className={styles.picker} role="dialog" aria-label="Choisir un émoji">
      {GROUPS.map((g) => (
        <section key={g.label} className="mb-2 last:mb-0">
          <h3 className="mb-1 px-1 font-mono text-[10px] uppercase tracking-[0.14em] text-graphite-faint">{g.label}</h3>
          <div className="grid grid-cols-8 gap-0.5">
            {g.emojis.map((e) => (
              <button key={e} type="button" onClick={() => onPick(e)} aria-label={`Insérer ${e}`} className={styles.emoji}>
                {e}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
