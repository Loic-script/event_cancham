"use client";

import { useState } from "react";
import { GoogleLogo } from "@/components/app/BrandLogos";
import styles from "./auth.module.css";

type Fournisseur = "google" | "facebook";

// Facebook est retiré des boutons (app Meta pas en mode Live) : voir FACEBOOK_ACTIF dans src/lib/oauth.ts pour le remettre.
const FOURNISSEURS: { key: Fournisseur; label: string; logo: React.ReactNode }[] = [{ key: "google", label: "Google", logo: <GoogleLogo size={20} /> }];

/**
 * Connexion ou inscription avec Google. Un fournisseur sans identifiants configurés
 * (GOOGLE_CLIENT_ID…) affiche un message au lieu de partir vers une erreur.
 */
export function BoutonsSociaux({ actifs, depuis, next }: { actifs: Record<Fournisseur, boolean>; depuis: "connexion" | "inscription"; next: string }) {
  const [notice, setNotice] = useState<string | null>(null);

  function lien(f: Fournisseur) {
    const p = new URLSearchParams({ depuis });
    if (next !== "/") p.set("next", next);
    return `/api/auth/${f}?${p}`;
  }

  return (
    <>
      <div className={styles.social}>
        {FOURNISSEURS.map(({ key, label, logo }) =>
          actifs[key] ? (
            <a key={key} href={lien(key)} className={styles.socialBtn}>
              {logo}
              {label}
            </a>
          ) : (
            <button key={key} type="button" className={styles.socialBtn} onClick={() => setNotice(`La connexion avec ${label} n’est pas encore activée.`)}>
              {logo}
              {label}
            </button>
          ),
        )}
      </div>
      <p role="status" className={notice ? styles.notice : "sr-only"}>
        {notice}
      </p>
    </>
  );
}
