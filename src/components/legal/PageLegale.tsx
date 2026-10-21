import Link from "next/link";
import type { ReactNode } from "react";
import { LOGO_BLANC } from "@/lib/traversee/data";
import styles from "./legal.module.css";

export const CONTACT = "contact@cancham.mg";
export const MISE_A_JOUR = "21 octobre 2026";

export function PageLegale({ titre, intro, children }: { titre: string; intro: string; children: ReactNode }) {
  return (
    <div className={`${styles.page} theme-light`}>
      <header className={styles.bandeau}>
        <Link href="/connexion" className={styles.logo} aria-label="La Traversée · CanCham Madagascar">
          <img src={LOGO_BLANC} alt="CanCham Madagascar" />
        </Link>
        <p className={styles.sur}>La Traversée · Gala des 10 ans</p>
        <h1>{titre}</h1>
        <p className={styles.intro}>{intro}</p>
        <p className={styles.date}>Dernière mise à jour : {MISE_A_JOUR}</p>
      </header>
      <main className={styles.contenu}>{children}</main>
      <footer className={styles.pied}>
        <Link href="/confidentialite">Politique de confidentialité</Link>
        <Link href="/suppression-donnees">Suppression des données</Link>
        <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
      </footer>
    </div>
  );
}
