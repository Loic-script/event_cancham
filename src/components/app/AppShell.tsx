"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useProfile } from "@/components/profile/useProfile";
import { AnnonceCard } from "@/components/traversee/AnnonceCard";
import { Modal } from "@/components/traversee/Modal";
import { Toaster } from "@/components/traversee/Toaster";
import { Puce } from "@/components/traversee/ui";
import { LOGO_BLANC, TYPES_ANNONCE, heureAnn } from "@/lib/traversee/data";
import { setTraversee, toast, useTraversee } from "@/lib/traversee/store";
import { fullName } from "@/lib/mock/data";
import { Avatar } from "./Avatar";
import {
  ArmchairIcon,
  BellIcon,
  BookIcon,
  CalendarCheckIcon,
  CalendarDaysIcon,
  CartIcon,
  ContactsIcon,
  FolderIcon,
  GiftIcon,
  HeadsetIcon,
  HomeIcon,
  ImageIcon,
  LogOutIcon,
  MegaphoneIcon,
  MenuIcon,
  MessageCircleIcon,
  TrophyIcon,
  UsersIcon,
  type IconProps,
} from "./icons";
import styles from "./shell.module.css";

type NavItem = { href: string; label: string; icon: (props: IconProps) => React.JSX.Element };
type NavSection = { titre: string; items: NavItem[] };

const NAV: NavSection[] = [
  {
    titre: "Événement",
    items: [
      { href: "/", label: "Accueil", icon: HomeIcon },
      { href: "/programme", label: "Programme", icon: CalendarDaysIcon },
      { href: "/defis/pitch", label: "Gagnez un voyage au Canada", icon: TrophyIcon },
      { href: "/defis/tombola", label: "Gagnez 3 000 000 Ar", icon: GiftIcon },
      { href: "/place", label: "Ma place", icon: ArmchairIcon },
      { href: "/achats", label: "Achats", icon: CartIcon },
    ],
  },
  {
    titre: "Réseau",
    items: [
      { href: "/annuaire", label: "Annuaire", icon: ContactsIcon },
      { href: "/rdv", label: "Mes rendez-vous", icon: CalendarCheckIcon },
      { href: "/messages", label: "Messagerie", icon: MessageCircleIcon },
      { href: "/ressources", label: "Ressources", icon: FolderIcon },
    ],
  },
  {
    titre: "Souvenirs",
    items: [
      { href: "/photos", label: "Photos et vidéos", icon: ImageIcon },
      { href: "/livre", label: "Livre d’or vidéo", icon: BookIcon },
    ],
  },
];

const NAV_ADMIN: NavSection[] = [
  {
    titre: "Pilotage",
    items: [
      { href: "/admin", label: "Accueil", icon: HomeIcon },
      { href: "/admin/annonces", label: "Annonces", icon: MegaphoneIcon },
      { href: "/admin/messagerie", label: "Messagerie", icon: MessageCircleIcon },
    ],
  },
  {
    titre: "Événement",
    items: [
      { href: "/admin/programme", label: "Programme", icon: CalendarDaysIcon },
      { href: "/admin/participants", label: "Participants", icon: UsersIcon },
      { href: "/admin/places", label: "Places", icon: ArmchairIcon },
      { href: "/admin/commandes", label: "Commandes", icon: CartIcon },
      { href: "/admin/defis/pitch", label: "Gagnez un voyage au Canada", icon: TrophyIcon },
      { href: "/admin/defis/tombola", label: "Gagnez 3 000 000 Ar", icon: GiftIcon },
    ],
  },
  {
    titre: "Contenus",
    items: [
      { href: "/admin/photos", label: "Photos et vidéos", icon: ImageIcon },
      { href: "/admin/livre", label: "Livre d’or", icon: BookIcon },
      { href: "/admin/ressources", label: "Ressources", icon: FolderIcon },
    ],
  },
];

const TITRES: Record<string, string> = {
  "/profil": "Profil",
  "/billet": "Mon billet",
  "/reseaux": "Réseaux sociaux",
  "/communaute": "Fil de communauté",
  "/defis": "Défis",
};

const BAS = ["/", "/programme", "/defis/pitch", "/rdv"];
const BAS_ADMIN = ["/admin", "/admin/annonces", "/admin/participants", "/admin/commandes"];
const BAS_LABEL: Record<string, string> = { "/defis/pitch": "Défis", "/rdv": "RDV", "/admin/participants": "Inscrits" };

function isActive(pathname: string, href: string) {
  if (href === "/" || href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const me = useProfile();
  const state = useTraversee();
  const [ouvert, setOuvert] = useState(false);
  const [cloche, setCloche] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [cheminPrecedent, setCheminPrecedent] = useState(pathname);
  if (cheminPrecedent !== pathname) {
    setCheminPrecedent(pathname);
    setOuvert(false);
  }

  const admin = pathname.startsWith("/admin");
  const immersive = /^\/messages\/[^/]+$/.test(pathname);
  const sections = admin ? NAV_ADMIN : NAV;
  const items = useMemo(() => sections.flatMap((s) => s.items), [sections]);
  const courant = items.filter((n) => isActive(pathname, n.href)).sort((a, b) => b.href.length - a.href.length)[0];
  const titre = courant?.label ?? Object.entries(TITRES).find(([k]) => isActive(pathname, k))?.[1] ?? "Accueil";
  const rdvActifs = state.rdv.filter((r) => r.etat === "attente" || r.etat === "confirme").length;
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

  return (
    <div className={`${styles.app} theme-light`}>
      <aside className={`${styles.lat} ${admin ? styles.latAdm : ""} ${ouvert ? styles.latOuvert : ""}`} aria-label="Menu principal">
        <Link href={admin ? "/admin" : "/"} className={styles.logo}>
          <img src={LOGO_BLANC} alt="CanCham" />
          <small>{admin ? "Back-office · La Traversée" : "La Traversée · 18 déc. 2026"}</small>
        </Link>
        <nav className={`${styles.nav} scroll-nuit`}>
          {sections.map((s) => (
            <div key={s.titre}>
              <h4>{s.titre}</h4>
              {s.items.map((n, i) => {
                const on = n === courant;
                const badge = n.href === "/messages" ? 1 : n.href === "/rdv" ? rdvActifs : n.href === "/admin/annonces" ? state.annonces.length : 0;
                return (
                  <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined} className={`${styles.item} ${on ? styles.itemOn : ""}`} style={{ "--i": i } as React.CSSProperties}>
                    <n.icon />
                    <span>{n.label}</span>
                    {badge ? <b>{badge}</b> : null}
                  </Link>
                );
              })}
            </div>
          ))}
          {admin ? (
            <div>
              <h4>Aperçu</h4>
              <Link href="/" className={styles.item}>
                <HomeIcon />
                <span>Ouvrir l’appli participant</span>
              </Link>
            </div>
          ) : (
            <div>
              <h4>Équipe</h4>
              <Link href="/admin" className={styles.item}>
                <MegaphoneIcon />
                <span>Back-office CanCham</span>
              </Link>
            </div>
          )}
        </nav>
        <Link href={admin ? "/admin" : "/profil"} className={styles.moi}>
          {admin ? (
            <span className="grid h-[38px] w-[38px] flex-none place-items-center rounded-full bg-white font-display text-[14px] text-gold">CC</span>
          ) : (
            <Avatar person={me} size={38} />
          )}
          <div className="min-w-0">
            <strong>{admin ? "Équipe CanCham" : fullName(me)}</strong>
            <small>{admin ? "Administration" : me.company || "Compléter mon profil"}</small>
          </div>
        </Link>
        <button type="button" className={styles.sortir} onClick={() => toast("Déconnexion désactivée dans la maquette.")}>
          <LogOutIcon />
          Se déconnecter
        </button>
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
            <button
              type="button"
              className={styles.cloche}
              onClick={() => {
                toutVu();
                setCloche(true);
              }}
              aria-label="Annonces"
            >
              <BellIcon />
              {!admin && nonVues.length ? <b>{nonVues.length}</b> : null}
            </button>
            <span className={styles.ex}>Données d’exemple</span>
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

      {cloche ? (
        <Modal onClose={() => setCloche(false)} label="Annonces" size="large">
          <h3 className="font-display text-[20px] text-graphite">Annonces</h3>
          <ul className={styles.listeAnn}>
            {state.annonces.length ? (
              state.annonces.map((a) => (
                <li key={a.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Puce tone={a.type === "urgent" ? "red" : "blue"}>{TYPES_ANNONCE[a.type]}</Puce>
                    <time>{heureAnn(a.t)}</time>
                  </div>
                  <strong>{a.titre}</strong>
                  <p>{a.message}</p>
                </li>
              ))
            ) : (
              <li>
                <p>Aucune annonce pour l’instant.</p>
              </li>
            )}
          </ul>
          <button type="button" onClick={() => setCloche(false)} className="h-11 cursor-pointer rounded-xl border border-line bg-surface text-[13px] font-bold text-graphite hover:border-gold hover:text-gold">
            Fermer
          </button>
        </Modal>
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
