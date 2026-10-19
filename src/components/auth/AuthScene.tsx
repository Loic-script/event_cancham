import { IBM_Plex_Sans } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
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
  children: ReactNode;
};

export function AuthScene({ headline, lead, cardTitle, children }: AuthSceneProps) {
  const initialRemaining = Math.floor((new Date(event.date).getTime() - new Date().getTime()) / 1000);

  return (
    <div className={`${plex.variable} ${styles.page}`}>
      <div className={styles.panel}>
        <PanelSlideshow />
      </div>

      <Link href="/" className={styles.brand} aria-label={`${event.name}, accueil`}>
        <Image src="/impact261/logo-blanc.svg" alt="" width={1248} height={505} loading="eager" className={styles.brandLogo} />
      </Link>

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

      <main className={styles.formSide}>
        <section className={styles.card} aria-labelledby="auth-card-title">
          <p className={styles.cardEyebrow}>Espace participant</p>
          <h2 id="auth-card-title" className={styles.cardTitle}>{cardTitle}</h2>
          {children}
        </section>
      </main>
    </div>
  );
}
