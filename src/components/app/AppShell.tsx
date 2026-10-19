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
import {
  ArmchairIcon,
  CameraIcon,
  BookIcon,
  CalendarDaysIcon,
  CartIcon,
  ContactsIcon,
  FolderIcon,
  GiftIcon,
  HeadsetIcon,
  HomeIcon,
  ImageIcon,
  MegaphoneIcon,
  MenuIcon,
  MessageCircleIcon,
  QrIcon,
  TrophyIcon,
  ShieldCheckIcon,
  UsersIcon,
  type IconProps,
} from "./icons";
import styles from "./shell.module.css";

type NavItem = { href: string; label: string; icon: (props: IconProps) => React.JSX.Element };
type NavSection = { titre?: string; pied?: boolean; items: NavItem[] };

const NAV: NavSection[] = [
  {
    titre: "Événement",
    items: [
      { href: "/", label: "Accueil", icon: HomeIcon },
      { href: "/programme", label: "Programme", icon: CalendarDaysIcon },
      { href: "/defis/pitch", label: "Gagnez un voyage au Canada", icon: TrophyIcon },
      { href: "/defis/tombola", label: "Gagnez 3 000 000 Ar", icon: GiftIcon },
    ],
  },
  {
    titre: "Réseau",
    items: [
      { href: "/annuaire", label: "Annuaire", icon: ContactsIcon },
      { href: "/messages", label: "Messagerie", icon: MessageCircleIcon },
      { href: "/ressources", label: "Ressources", icon: FolderIcon },
    ],
  },
  {
    titre: "Souvenirs",
    items: [
      { href: "/photos", label: "Photos et vidéos", icon: CameraIcon },
    ],
  },
];

const NAV_ADMIN: NavSection[] = [
  {
    items: [{ href: "/admin", label: "Tableau de bord", icon: HomeIcon }],
  },
  {
    titre: "Participants",
    items: [
      { href: "/admin/participants", label: "Annuaire", icon: UsersIcon },
      { href: "/admin/scanner", label: "Scanner QR", icon: QrIcon },
      { href: "/admin/places", label: "Places", icon: ArmchairIcon },
      { href: "/admin/commandes", label: "Commandes", icon: CartIcon },
      { href: "/admin/messagerie", label: "Messagerie", icon: MessageCircleIcon },
    ],
  },
  {
    titre: "Communication",
    items: [
      { href: "/admin/annonces", label: "Annonces", icon: MegaphoneIcon },
      { href: "/admin/programme", label: "Programme", icon: CalendarDaysIcon },
      { href: "/admin/photos", label: "Photos et vidéos", icon: ImageIcon },
      { href: "/admin/livre", label: "Livre d’or", icon: BookIcon },
      { href: "/admin/ressources", label: "Ressources", icon: FolderIcon },
    ],
  },
  {
    titre: "Défis",
    items: [
      { href: "/admin/defis/pitch", label: "Voyage au Canada", icon: TrophyIcon },
      { href: "/admin/defis/tombola", label: "3 000 000 Ar", icon: GiftIcon },
    ],
  },
  {
    pied: true,
    items: [{ href: "/admin/administrateurs", label: "Administrateurs", icon: ShieldCheckIcon }],
  },
];

const TITRES: Record<string, string> = {
  "/profil": "Profil",
  "/billet": "Mon billet",
  "/reseaux": "Réseaux sociaux",
  "/communaute": "Fil de communauté",
  "/defis": "Défis",
};

const BAS = ["/", "/defis/pitch", "/programme", "/annuaire"];
const BAS_ADMIN = ["/admin", "/admin/scanner", "/admin/participants", "/admin/commandes"];
const BAS_LABEL: Record<string, string> = { "/defis/pitch": "Défis", "/admin": "Accueil", "/admin/participants": "Annuaire", "/admin/scanner": "Scanner" };

function isActive(pathname: string, href: string) {
  if (href === "/" || href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const state = useTraversee();
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [cheminPrecedent, setCheminPrecedent] = useState(pathname);
  if (cheminPrecedent !== pathname) {
    setCheminPrecedent(pathname);
    setOuvert(false);
  }

  const admin = pathname.startsWith("/admin");
  const immersive = /^\/(admin\/messagerie|messages)\/[^/]+$/.test(pathname);
  const sections = admin ? NAV_ADMIN : NAV;
  const items = useMemo(() => sections.flatMap((s) => s.items), [sections]);
  const courant = items.filter((n) => isActive(pathname, n.href)).sort((a, b) => b.href.length - a.href.length)[0];
  const titre = courant?.label ?? Object.entries(TITRES).find(([k]) => isActive(pathname, k))?.[1] ?? "Accueil";
  const nonVues = state.annonces.filter((a) => !state.annoncesVues[a.id]);
  const popup = !admin && nonVues[0];

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

  function lien(n: NavItem, i: number) {
    const on = n === courant;
    const badge = n.href === "/messages" ? 1 : n.href === "/admin/annonces" ? state.annonces.length : 0;
    return (
      <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined} className={`${styles.item} ${on ? styles.itemOn : ""}`} style={{ "--i": i } as React.CSSProperties}>
        <n.icon />
        <span>{n.label}</span>
        {badge ? <b>{badge}</b> : null}
      </Link>
    );
  }

  const pied = sections.filter((s) => s.pied).flatMap((s) => s.items);

  return (
    <div className={`${styles.app} theme-light`}>
      <aside className={`${styles.lat} ${admin ? styles.latAdm : ""} ${ouvert ? styles.latOuvert : ""}`} aria-label="Menu principal">
        <Link href={admin ? "/admin" : "/"} className={styles.logo}>
          <img src={LOGO_BLANC} alt="CanCham" />
          <small>{admin ? "Back-office · La Traversée" : "La Traversée · 18 déc. 2026"}</small>
        </Link>
        <nav className={`${styles.nav} scroll-nuit`}>
          {sections
            .filter((s) => !s.pied)
            .map((s) => (
              <div key={s.titre ?? s.items[0].href}>
                {s.titre ? <h4>{s.titre}</h4> : null}
                {s.items.map(lien)}
              </div>
            ))}
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
              {admin ? "Back-office" : "La Traversée"} / <b>{titre}</b>
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
            <Notifications admin={admin} />
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
                <n.icon />
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
        <Link href="/messages/c1" className={styles.aide} aria-label="Écrire à l’équipe CanCham">
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
