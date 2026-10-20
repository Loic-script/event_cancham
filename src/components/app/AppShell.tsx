"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { AnnonceCard } from "@/components/traversee/AnnonceCard";
import { Modal } from "@/components/traversee/Modal";
import { Toaster } from "@/components/traversee/Toaster";
import { LOGO_BLANC } from "@/lib/traversee/data";
import { setTraversee, useTraversee } from "@/lib/traversee/store";
import { MenuCompte } from "./MenuCompte";
import { Notifications } from "./Notifications";
import { ChevronRightIcon, HeadsetIcon, MenuIcon } from "./icons";
import { ICONES, IconeNavigation, type IconeNav } from "./iconesNav";
import styles from "./shell.module.css";

/** Les rubriques d'un sous-menu n'affichent pas d'icône : elle ne sert qu'à la barre du bas. */
type NavItem = { href: string; label: string; icon?: IconeNav };
/** Une section avec `icon` s'affiche comme un sous-menu dépliable. */
type NavSection = { titre?: string; icon?: IconeNav; pied?: boolean; items: NavItem[] };

const NAV: NavSection[] = [
  {
    titre: "Événement",
    items: [
      { href: "/", label: "Accueil", icon: ICONES.accueil },
      { href: "/programme", label: "Programme", icon: ICONES.programme },
      { href: "/defis/pitch", label: "Gagnez un voyage au Canada", icon: ICONES.trophee },
      { href: "/defis/tombola", label: "Gagnez 3 000 000 Ar", icon: ICONES.cadeau },
    ],
  },
  {
    titre: "Réseau",
    items: [
      { href: "/annuaire", label: "Annuaire", icon: ICONES.annuaire },
      { href: "/messages", label: "Messagerie", icon: ICONES.messagerie },
      { href: "/ressources", label: "Ressources", icon: ICONES.dossier },
    ],
  },
  {
    titre: "Souvenirs",
    items: [
      { href: "/photos", label: "Photos et vidéos", icon: ICONES.appareil },
    ],
  },
];

const NAV_ADMIN: NavSection[] = [
  {
    items: [{ href: "/admin", label: "Tableau de bord", icon: ICONES.accueil }],
  },
  {
    titre: "Participants",
    icon: ICONES.personnes,
    items: [
      { href: "/admin/acces", label: "Demandes d’accès" },
      { href: "/admin/participants", label: "Annuaire", icon: ICONES.personnes },
      { href: "/admin/scanner", label: "Scanner QR", icon: ICONES.qr },
      { href: "/admin/places", label: "Places" },
      { href: "/admin/commandes", label: "Commandes", icon: ICONES.panier },
      { href: "/admin/messagerie", label: "Messagerie" },
    ],
  },
  {
    titre: "Communication",
    icon: ICONES.megaphone,
    items: [
      { href: "/admin/annonces", label: "Annonces" },
      { href: "/admin/programme", label: "Programme" },
      { href: "/admin/photos", label: "Photos et vidéos" },
      { href: "/admin/livre", label: "Livre d’or" },
      { href: "/admin/ressources", label: "Ressources" },
    ],
  },
  {
    titre: "Défis",
    icon: ICONES.trophee,
    items: [
      { href: "/admin/defis/pitch", label: "Voyage au Canada" },
      { href: "/admin/defis/tombola", label: "3 000 000 Ar" },
    ],
  },
  {
    pied: true,
    items: [{ href: "/admin/administrateurs", label: "Administrateurs", icon: ICONES.bouclier }],
  },
];

const TITRES: Record<string, string> = {
  "/profil": "Profil",
  "/billet": "Mon billet",
  "/reseaux": "Réseaux sociaux",
  "/communaute": "Fil de communauté",
  "/defis": "Défis",
  "/admin/compte": "Mon compte",
};

const BAS = ["/", "/defis/pitch", "/programme", "/annuaire"];
const BAS_ADMIN = ["/admin", "/admin/scanner", "/admin/participants", "/admin/commandes"];
const BAS_LABEL: Record<string, string> = { "/defis/pitch": "Défis", "/admin": "Accueil", "/admin/participants": "Annuaire", "/admin/scanner": "Scanner" };

function isActive(pathname: string, href: string) {
  if (href === "/" || href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupeDe(pathname: string) {
  return NAV_ADMIN.find((s) => s.icon && s.items.some((n) => isActive(pathname, n.href)))?.titre ?? null;
}

/**
 * `enAttente` : inscriptions à valider, affichées en pastille dans le back-office.
 * `nonLus` : messages non lus du compte ; `nonLusEquipe` : messages des participants non lus par l'équipe (administrateurs).
 */
export function AppShell({ children, enAttente = 0, nonLus = 0, nonLusEquipe = 0 }: { children: ReactNode; enAttente?: number; nonLus?: number; nonLusEquipe?: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const state = useTraversee();
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [groupe, setGroupe] = useState(() => groupeDe(pathname));
  const [cheminPrecedent, setCheminPrecedent] = useState(pathname);
  const [messages, setMessages] = useState({ membre: nonLus, equipe: nonLusEquipe, source: { nonLus, nonLusEquipe } });
  if (messages.source.nonLus !== nonLus || messages.source.nonLusEquipe !== nonLusEquipe) {
    setMessages({ membre: nonLus, equipe: nonLusEquipe, source: { nonLus, nonLusEquipe } });
  }
  if (cheminPrecedent !== pathname) {
    setCheminPrecedent(pathname);
    setOuvert(false);
    setGroupe(groupeDe(pathname));
  }

  const admin = pathname.startsWith("/admin");
  const immersive = /^\/(admin\/messagerie|messages)\/[^/]+$/.test(pathname);
  const sections = admin ? NAV_ADMIN : NAV;
  const items = useMemo(() => sections.flatMap((s) => s.items), [sections]);
  const courant = items.filter((n) => isActive(pathname, n.href)).sort((a, b) => b.href.length - a.href.length)[0];
  const titre = courant?.label ?? Object.entries(TITRES).find(([k]) => isActive(pathname, k))?.[1] ?? "Accueil";
  const nonVues = state.annonces.filter((a) => !state.annoncesVues[a.id]);
  const popup = !admin && nonVues[0];

  // Pastilles de la messagerie à jour sans recharger la page.
  useEffect(() => {
    let actif = true;
    async function actualiser() {
      if (document.hidden) return;
      const r = await fetch("/api/messages/non-lus", { cache: "no-store" }).catch(() => null);
      const corps = r?.ok ? ((await r.json().catch(() => null)) as { membre?: number; equipe?: number } | null) : null;
      if (actif && corps) setMessages((m) => ({ ...m, membre: corps.membre ?? 0, equipe: corps.equipe ?? 0 }));
    }
    const id = window.setInterval(() => void actualiser(), 30_000);
    return () => {
      actif = false;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!ouvert) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOuvert(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ouvert]);

  function toutVu() {
    setTraversee((s) => ({ annoncesVues: { ...s.annoncesVues, ...Object.fromEntries(s.annonces.map((a) => [a.id, 1 as const])) } }));
  }

  function chercher(e: FormEvent) {
    e.preventDefault();
    const q = recherche.trim();
    router.push(q ? `/annuaire?q=${encodeURIComponent(q)}` : "/annuaire");
  }

  const basItems = (admin ? BAS_ADMIN : BAS).map((href) => items.find((n) => n.href === href)!);

  function badgeDe(href: string) {
    if (href === "/admin/acces") return enAttente;
    if (href === "/messages") return messages.membre;
    if (href === "/admin/messagerie") return messages.equipe;
    return href === "/admin/annonces" ? state.annonces.length : 0;
  }

  const accueilHref = admin ? "/admin" : "/";
  const messagerieHref = admin ? "/admin/messagerie" : "/messages";
  const badgeMessagerie = badgeDe(messagerieHref);

  function lien(n: NavItem, i: number) {
    const on = n === courant;
    const badge = badgeDe(n.href);
    return (
      <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined} className={`${styles.item} ${on ? styles.itemOn : ""}`} style={{ "--i": i } as React.CSSProperties}>
        {n.icon ? <IconeNavigation icone={n.icon} active={on} /> : null}
        <span>{n.label}</span>
        {badge ? <b>{badge}</b> : null}
      </Link>
    );
  }

  function sousMenu(s: NavSection, k: number) {
    const titre = s.titre ?? "";
    const deplie = groupe === titre;
    const contientCourant = !!courant && s.items.includes(courant);
    const total = s.items.reduce((t, n) => t + badgeDe(n.href), 0);
    const id = `sous-menu-${k}`;
    return (
      <div key={titre}>
        <button
          type="button"
          className={`${styles.item} ${styles.parent} ${contientCourant ? styles.parentOn : ""}`}
          style={{ "--i": k } as React.CSSProperties}
          aria-expanded={deplie}
          aria-controls={id}
          onClick={() => setGroupe(deplie ? null : titre)}
        >
          <IconeNavigation icone={s.icon!} active={contientCourant} />
          <span>{titre}</span>
          {!deplie && total ? <b>{total}</b> : null}
          <ChevronRightIcon className={styles.chevron} aria-hidden />
        </button>
        <div id={id} className={`${styles.sous} ${deplie ? styles.sousOuvert : ""}`} inert={!deplie}>
          <div>
            {s.items.map((n) => {
              const on = n === courant;
              const badge = badgeDe(n.href);
              return (
                <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined} className={`${styles.sousItem} ${on ? styles.sousItemOn : ""}`}>
                  <span>{n.label}</span>
                  {badge ? <b>{badge}</b> : null}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const pied = sections.filter((s) => s.pied).flatMap((s) => s.items);

  return (
    <div className={`${styles.app} theme-light`}>
      <aside className={`${styles.lat} ${admin ? styles.latAdm : ""} ${ouvert ? styles.latOuvert : ""}`} aria-label="Menu principal">
        <Link href={admin ? "/admin" : "/"} className={styles.logo}>
          <img src={LOGO_BLANC} alt="IMPACT 261" />
          <small>{admin ? "Back-office · La Traversée" : "La Traversée · 18 déc. 2026"}</small>
        </Link>
        <nav className={`${styles.nav} scroll-nuit`}>
          {sections
            .filter((s) => !s.pied)
            .map((s, k) =>
              s.icon ? (
                sousMenu(s, k)
              ) : (
                <div key={s.titre ?? s.items[0].href}>
                  {s.titre ? <h4>{s.titre}</h4> : null}
                  {s.items.map(lien)}
                </div>
              ),
            )}
        </nav>
        {pied.length ? <div className={styles.pied}>{pied.map(lien)}</div> : null}
      </aside>
      {ouvert ? <div className={styles.fond} onClick={() => setOuvert(false)} aria-hidden /> : null}

      <div className={styles.corps}>
        {!immersive ? (
          <header className={styles.haut}>
            <button type="button" className={styles.menu} onClick={() => setOuvert(true)} aria-label="Ouvrir le menu" aria-expanded={ouvert}>
              <MenuIcon width={22} height={22} />
            </button>
            <p className={styles.fil}>
              <span className={styles.filPrefixe}>{admin ? "Back-office" : "La Traversée"} / </span>
              <b>{titre}</b>
            </p>
            {!admin ? (
              <form className={styles.cherche} onSubmit={chercher} role="search">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <input value={recherche} onChange={(e) => setRecherche(e.target.value)} type="search" placeholder="Rechercher un participant, un panel…" aria-label="Rechercher" />
              </form>
            ) : (
              <span className="ml-auto" />
            )}
            <div className={styles.raccourcis}>
              <Link href={accueilHref} className={`${styles.raccourci} ${styles.raccourciAccueil}`} aria-label="Accueil" aria-current={pathname === accueilHref ? "page" : undefined}>
                <IconeNavigation icone={ICONES.accueil} active={pathname === accueilHref} />
              </Link>
              <Notifications admin={admin} />
              <Link
                href={messagerieHref}
                className={styles.raccourci}
                aria-label={badgeMessagerie ? `Messagerie, ${badgeMessagerie} non lu${badgeMessagerie > 1 ? "s" : ""}` : "Messagerie"}
                aria-current={isActive(pathname, messagerieHref) ? "page" : undefined}
              >
                <IconeNavigation icone={ICONES.messagerie} active={isActive(pathname, messagerieHref)} />
                {badgeMessagerie ? <b>{badgeMessagerie}</b> : null}
              </Link>
            </div>
            <MenuCompte admin={admin} />
          </header>
        ) : null}

        <main key={pathname} className={immersive ? "" : styles.page}>
          {children}
        </main>
      </div>

      {!immersive ? (
        <nav className={styles.bas} aria-label="Navigation rapide">
          {basItems.map((n) => {
            const on = n === courant;
            return (
              <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined} className={`${styles.basItem} ${on ? styles.basOn : ""}`}>
                {n.icon ? <IconeNavigation icone={n.icon} active={on} /> : null}
                {BAS_LABEL[n.href] ?? n.label}
              </Link>
            );
          })}
          <button type="button" className={styles.basItem} onClick={() => setOuvert(true)} aria-label="Ouvrir le menu">
            <MenuIcon />
            Menu
          </button>
        </nav>
      ) : null}

      {!admin && !pathname.startsWith("/messages") ? (
        <Link href="/messages/equipe" className={styles.aide} aria-label="Écrire à l’équipe CanCham">
          <HeadsetIcon />
        </Link>
      ) : null}

      {popup ? (
        <Modal onClose={toutVu} label="Annonce" size="narrow" className="!p-0 !overflow-hidden">
          <AnnonceCard annonce={popup} onClose={toutVu} />
        </Modal>
      ) : null}

      <Toaster />
    </div>
  );
}
