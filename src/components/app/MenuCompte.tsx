"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/app/connexion/actions";
import { useProfile, useSessionIdentity } from "@/components/profile/useProfile";
import { fullName } from "@/lib/mock/data";
import { Avatar } from "./Avatar";
import { ChevronRightIcon, LogOutIcon, MegaphoneIcon, TicketIcon, UserIcon } from "./icons";
import styles from "./menuCompte.module.css";

export function MenuCompte({ admin }: { admin: boolean }) {
  const pathname = usePathname();
  const me = useProfile();
  const session = useSessionIdentity();
  const [ouvert, setOuvert] = useState(false);
  const [chemin, setChemin] = useState(pathname);
  const zone = useRef<HTMLDivElement | null>(null);

  if (chemin !== pathname) {
    setChemin(pathname);
    setOuvert(false);
  }

  useEffect(() => {
    if (!ouvert) return;
    const dehors = (e: PointerEvent) => {
      if (zone.current && !zone.current.contains(e.target as Node)) setOuvert(false);
    };
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOuvert(false);
    };
    document.addEventListener("pointerdown", dehors);
    window.addEventListener("keydown", touche);
    return () => {
      document.removeEventListener("pointerdown", dehors);
      window.removeEventListener("keydown", touche);
    };
  }, [ouvert]);

  const estAdmin = session?.acces === "ADMIN";
  const nom = session ? `${session.firstName} ${session.lastName}`.trim() : fullName(me);
  const sousTitre = admin ? "Administration" : me.company || session?.company || "Compléter mon profil";

  return (
    <div className={styles.zone} ref={zone}>
      <button type="button" className={`${styles.declencheur} ${ouvert ? styles.actif : ""}`} onClick={() => setOuvert((v) => !v)} aria-haspopup="menu" aria-expanded={ouvert} aria-label={`Compte de ${nom}`}>
        <Avatar person={me} size={38} />
        <span className={styles.chevron} aria-hidden>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {ouvert ? (
        <div className={styles.panneau} role="menu" aria-label="Menu du compte">
          <Link href="/profil" className={styles.carte} role="menuitem">
            <Avatar person={me} size={52} />
            <span className="min-w-0 flex-1">
              <strong>{nom}</strong>
              <small>{sousTitre}</small>
              {session?.email ? <em>{session.email}</em> : null}
            </span>
            <ChevronRightIcon width={18} height={18} className={styles.fleche} />
          </Link>
          {estAdmin ? <span className={styles.badge}>Administrateur</span> : null}
          <div className={styles.separateur} />
          <Link href="/profil" className={styles.option} role="menuitem">
            <span className={styles.icone}>
              <UserIcon width={18} height={18} />
            </span>
            Mon profil
          </Link>
          {!admin ? (
            <Link href="/billet" className={styles.option} role="menuitem">
              <span className={styles.icone}>
                <TicketIcon width={18} height={18} />
              </span>
              Mon billet
            </Link>
          ) : null}
          {!admin && estAdmin ? (
            <Link href="/admin" className={styles.option} role="menuitem">
              <span className={styles.icone}>
                <MegaphoneIcon width={18} height={18} />
              </span>
              Back-office CanCham
            </Link>
          ) : null}
          <div className={styles.separateur} />
          <form action={logout}>
            <button type="submit" className={`${styles.option} ${styles.sortir}`} role="menuitem">
              <span className={styles.icone}>
                <LogOutIcon width={18} height={18} />
              </span>
              Se déconnecter
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
