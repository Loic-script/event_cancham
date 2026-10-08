import type { ChallengeTheme } from "@/lib/mock/challenges";
import styles from "./stories.module.css";

const BASE: Record<ChallengeTheme, string> = {
  leaf: "linear-gradient(160deg, #3a0710 0%, #6e0404 100%)",
  navy: "linear-gradient(160deg, #0b152e 0%, #1d3f78 100%)",
  palm: "linear-gradient(160deg, #003a21 0%, #007140 100%)",
};

const ACCENT: Record<ChallengeTheme, string> = {
  leaf: "rgba(255, 150, 120, 0.55)",
  navy: "rgba(120, 170, 255, 0.5)",
  palm: "rgba(130, 230, 170, 0.5)",
};

type StoryArtProps = {
  /** Photo réelle, si elle existe. */
  image?: string;
  theme: ChallengeTheme;
  /** Teinte de la personne : colore le halo principal. */
  hue: number;
  /** Graine pour déplacer légèrement la composition d'une story à l'autre. */
  seed: string;
  alt?: string;
};

// Visuel d'une story : la photo si on en a une, sinon une composition
// abstraite aux couleurs du défi et du participant.
export function StoryArt({ image, theme, hue, seed, alt = "" }: StoryArtProps) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element -- photo locale de taille libre
    return <img src={image} alt={alt} className={styles.photo} />;
  }
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const x = 20 + (h % 45);
  const y = 20 + ((h >> 4) % 35);
  return (
    <span
      className={styles.art}
      aria-hidden
      style={
        {
          "--base": BASE[theme],
          "--accent": ACCENT[theme],
          "--person": `hsl(${hue} 70% 62% / 0.75)`,
          "--x": `${x}%`,
          "--y": `${y}%`,
        } as React.CSSProperties
      }
    />
  );
}
