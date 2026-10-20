import { IBM_Plex_Sans } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { ViewTransition, type ReactNode } from "react";
import { CalendarIcon, MapPinIcon } from "@/components/app/icons";
import { event } from "@/lib/mock/data";
import { AuthCountdown } from "./AuthCountdown";
import { PanelSlideshow } from "./PanelSlideshow";
import styles from "./auth.module.css";

const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

type Headline = { first: string; prefix?: string; accent: string };

type AuthSceneProps = {
  headline: Headline;
  lead: string;
  cardTitle: string;
  /** Formulaire à gauche et photo à droite (inscription). */
  inverse?: boolean;
  children: ReactNode;
};

const CLASSES = { glisse: "auth-glisse", relais: "auth-glisse auth-relais", garde: "auth-glisse auth-garde" };

/**
 * Les blocs portent le même nom sur /connexion et /inscription : en passant de
 * l'une à l'autre, le navigateur les fait glisser vers leur nouvelle place.
 * `relais` : l'ancien contenu s'efface avant que le nouveau apparaisse (texte qui change).
 * `garde` : l'ancien rendu reste affiché pendant le glissement (photo pas encore chargée).
 */
function Glisse({ name, mode = "glisse", children }: { name: string; mode?: keyof typeof CLASSES; children: ReactNode }) {
  return (
    <ViewTransition name={`auth-${name}`} share={CLASSES[mode]} default="none">
      {children}
    </ViewTransition>
  );
}

export function AuthScene({ headline, lead, cardTitle, inverse = false, children }: AuthSceneProps) {
  const initialRemaining = Math.floor((new Date(event.date).getTime() - new Date().getTime()) / 1000);

  return (
    <div className={`${plex.variable} ${styles.page} ${inverse ? styles.inverse : ""}`}>
      <Glisse name="panneau" mode="garde">
        <div className={styles.panel}>
          <PanelSlideshow />
        </div>
      </Glisse>

      <Glisse name="logo">
        <Link href="/" className={styles.brand} aria-label={`${event.name}, accueil`}>
          <Image src="/impact261/logo-blanc.svg" alt="" width={1248} height={505} loading="eager" className={styles.brandLogo} />
        </Link>
      </Glisse>

      <Glisse name="intro" mode="relais">
        <div className={styles.intro}>
          <Image src="/connexion/10-ans.png" alt={event.edition} width={640} height={225} loading="eager" className={styles.emblem} />
          <h1 id="auth-title" className={styles.title}>
            {headline.first}
            <br />
            {headline.prefix}
            <em className={styles.titleAccent}>{headline.accent}</em>
          </h1>
          <p className={styles.lead}>{lead}</p>
          <AuthCountdown target={event.date} initialRemaining={initialRemaining} />
        </div>
      </Glisse>

      <Glisse name="infos" mode="relais">
        <ul className={styles.facts} aria-label="Le gala">
          <li>
            <span className={styles.factIcon} aria-hidden>
              <CalendarIcon width={18} height={18} />
            </span>
            <span>
              {event.dateLabel} · {event.timeLabel}
            </span>
          </li>
          <li>
            <span className={styles.factIcon} aria-hidden>
              <MapPinIcon width={18} height={18} />
            </span>
            <span>
              {event.venue}, {event.city}
            </span>
          </li>
        </ul>
      </Glisse>

      <Glisse name="formulaire">
        <main className={styles.formSide}>
          {/* Sur ordinateur, seule cette colonne défile : la photo et ses textes restent fixes. */}
          <div className={styles.defile}>
            <Glisse name="carte" mode="relais">
              <section className={styles.card} aria-labelledby="auth-card-title">
                <p className={styles.cardEyebrow}>Espace participant</p>
                <h2 id="auth-card-title" className={styles.cardTitle}>{cardTitle}</h2>
                {children}
              </section>
            </Glisse>
          </div>
        </main>
      </Glisse>
    </div>
  );
}
