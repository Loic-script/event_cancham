"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useProfile } from "@/components/profile/useProfile";
import { event, fullName, unreadTotal } from "@/lib/mock/data";
import { Avatar } from "./Avatar";
import {
  BellIcon,
  ChevronRightIcon,
  GlobeIcon,
  HomeIcon,
  MessageCircleIcon,
  MoreIcon,
  TicketIcon,
  TrophyIcon,
  UserIcon,
  UsersIcon,
  XIcon,
  type IconProps,
} from "./icons";
import { SearchPill } from "./SearchPill";
import styles from "./app.module.css";

type NavItem = {
  href: string;
  label: string;
  short?: string;
  icon: (props: IconProps) => React.JSX.Element;
};

const NAV: NavItem[] = [
  { href: "/", label: "Accueil", icon: HomeIcon },
  { href: "/billet", label: "Billet", icon: TicketIcon },
  { href: "/defis", label: "Les défis", icon: TrophyIcon },
  { href: "/reseaux", label: "Réseaux sociaux", icon: GlobeIcon },
  { href: "/communaute", label: "Fil de communauté", short: "Fil", icon: UsersIcon },
  { href: "/messages", label: "Messages", icon: MessageCircleIcon },
  { href: "/profil", label: "Profil", icon: UserIcon },
];

const TABS = ["/", "/communaute", "/billet", "/messages", "/profil"];
const MORE = ["/defis", "/reseaux"];

const TITLES: Record<string, string> = {
  "/": "Accueil",
  "/billet": "Mon billet",
  "/defis": "Les défis",
  "/reseaux": "Réseaux sociaux",
  "/communaute": "Fil de communauté",
  "/messages": "Messages",
  "/profil": "Profil",
};

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

const iconBtn =
  "grid h-10 w-10 cursor-pointer place-items-center rounded-full text-graphite-muted transition-colors hover:bg-black/5 hover:text-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm-ink";

type AppShellProps = {
  children: ReactNode;
  aside?: ReactNode;
};

export function AppShell({ children, aside }: AppShellProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const unread = unreadTotal();
  const me = useProfile();

  const immersive = /^\/messages\/[^/]+$/.test(pathname);
  const wide = pathname.startsWith("/messages");
  const sectionHref = NAV.map((n) => n.href).find((href) => isActive(pathname, href)) ?? "/";
  const activeIndex = NAV.findIndex((n) => isActive(pathname, n.href));
  const title = TITLES[sectionHref] ?? "Event";

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  return (
    <div className={`${styles.app} theme-light`}>
      <aside className={`${styles.sidebar} fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col px-4 py-6 lg:flex`}>
        <Link href="/" className="mb-8 flex items-center gap-3 rounded-xl px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm-ink">
          <Image src="/cancham-logo.png" alt="CanCham Madagascar" width={156} height={96} priority className="h-12 w-auto shrink-0" />
          <span className="flex flex-col leading-tight">
            <span className="font-display text-[1.25rem] tracking-tight text-graphite">{event.name}</span>
            <span className="text-[12px] text-graphite-muted">{event.edition}</span>
          </span>
        </Link>

        <nav aria-label="Navigation principale" className="flex flex-1 flex-col">
          <p className={styles.sideLabel}>Menu</p>
          <div className={styles.sideNav}>
            <span
              className={styles.sideIndicator}
              data-indicator
              aria-hidden
              style={{ "--active": Math.max(0, activeIndex), "--visible": activeIndex < 0 ? 0 : 1 } as React.CSSProperties}
            />
            {NAV.map((item, i) => {
              const active = i === activeIndex;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`${styles.sideItem} ${active ? styles.sideItemActive : ""}`}
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <span className={styles.sideIcon}>
                    <item.icon width={19} height={19} />
                  </span>
                  <span className={styles.sideText}>{item.label}</span>
                  {item.href === "/messages" && unread > 0 ? (
                    <span className={styles.sideBadge}>{unread}</span>
                  ) : (
                    <ChevronRightIcon width={16} height={16} className={styles.sideArrow} />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        <Link
          href="/profil"
          className={`${styles.card} ${styles.sideProfile} mt-4 flex items-center gap-3 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm-ink`}
        >
          <Avatar person={me} size={40} presence />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-semibold text-graphite">{fullName(me)}</span>
            <span className="block truncate text-[12px] text-graphite-muted">{me.company}</span>
          </span>
          <ChevronRightIcon width={16} height={16} className={styles.sideArrow} />
        </Link>
      </aside>

      <div className={`lg:pl-[264px] ${aside && !wide ? "xl:pr-[320px]" : ""}`}>
        {!immersive ? (
          <header className={`${styles.topbar} lg:hidden`}>
            <div className="flex h-14 items-center gap-3 px-4" style={{ paddingTop: "env(safe-area-inset-top)" }}>
              <Link href="/" aria-label="Accueil" className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm-ink">
                <Image src="/cancham-logo.png" alt="" width={117} height={72} priority className="h-9 w-auto" />
              </Link>
              <h1 className="min-w-0 flex-1 truncate font-display text-[1.3rem] leading-none tracking-tight text-graphite">{title}</h1>
              <button type="button" aria-label="Notifications" className={iconBtn}>
                <BellIcon width={21} height={21} />
              </button>
              <button type="button" aria-label="Plus de rubriques" aria-expanded={moreOpen} onClick={() => setMoreOpen(true)} className={iconBtn}>
                <MoreIcon width={22} height={22} />
              </button>
            </div>
          </header>
        ) : null}

        {!immersive ? (
          <header className={`${styles.topbar} hidden lg:block`}>
            <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-10">
              <p className="w-52 shrink-0 font-display text-[1.2rem] tracking-tight text-graphite">{title}</p>
              <SearchPill className="mx-auto w-full max-w-md" />
              <span className="relative">
                <button type="button" aria-label="Notifications" className={iconBtn}>
                  <BellIcon width={21} height={21} />
                </button>
                {unread > 0 ? <span className="pointer-events-none absolute right-2 top-2 h-2 w-2 rounded-full bg-leaf ring-2 ring-page-bg" /> : null}
              </span>
              <Link href="/profil" aria-label="Mon profil" className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm-ink">
                <Avatar person={me} size={36} />
              </Link>
            </div>
          </header>
        ) : null}

        <main key={pathname} className={`${immersive ? "" : `${styles.page} px-4 pb-28 pt-4 lg:px-10 lg:py-8`} mx-auto w-full max-w-6xl`}>
          {children}
        </main>
      </div>

      {aside && !wide ? (
        <aside className={`${styles.aside} fixed inset-y-0 right-0 z-20 hidden w-[320px] overflow-y-auto px-5 py-6 xl:block`} aria-label="Panneau latéral">
          {aside}
        </aside>
      ) : null}

      {!immersive ? (
        <nav aria-label="Navigation principale" className={`${styles.tabbar} lg:hidden`}>
          {TABS.map((href) => {
            const item = NAV.find((n) => n.href === href)!;
            const active = isActive(pathname, href);
            const hero = href === "/billet";
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                className={`${styles.tab} ${hero ? styles.tabHero : ""} ${active ? (hero ? styles.tabHeroActive : styles.tabActive) : ""}`}
              >
                {hero ? (
                  <span className={styles.heroDisc}>
                    <item.icon width={24} height={24} strokeWidth={2} />
                  </span>
                ) : (
                  <item.icon width={23} height={23} strokeWidth={active ? 2.2 : 1.75} />
                )}
                <span>{item.short ?? item.label}</span>
                {href === "/messages" && unread > 0 ? <span className={styles.badge}>{unread}</span> : null}
              </Link>
            );
          })}
        </nav>
      ) : null}

      {moreOpen ? (
        <>
          <div className={styles.scrim} onClick={() => setMoreOpen(false)} aria-hidden />
          <div className={styles.sheet} role="dialog" aria-modal="true" aria-label="Plus de rubriques">
            <div className={styles.sheetHandle} aria-hidden />
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="font-display text-[1.2rem] text-graphite">Plus</p>
              <button type="button" onClick={() => setMoreOpen(false)} aria-label="Fermer" className={iconBtn}>
                <XIcon width={20} height={20} />
              </button>
            </div>
            <ul className="flex flex-col gap-1">
              {MORE.map((href) => {
                const item = NAV.find((n) => n.href === href)!;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setMoreOpen(false)}
                      className={`${styles.sideItem} ${isActive(pathname, href) ? styles.sideItemActive : ""} text-[16px]`}
                    >
                      <span className={styles.sideIcon}>
                        <item.icon width={20} height={20} />
                      </span>
                      <span className={styles.sideText}>{item.label}</span>
                      <ChevronRightIcon width={16} height={16} className={styles.sideArrow} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}
