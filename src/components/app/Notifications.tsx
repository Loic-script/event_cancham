"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type JSX } from "react";
import { createPortal } from "react-dom";
import { useSessionIdentity } from "@/components/profile/useProfile";
import { AnnonceCard } from "@/components/traversee/AnnonceCard";
import { Modal } from "@/components/traversee/Modal";
import { AvatarInitiales } from "@/components/traversee/ui";
import { SIGLE, TYPES_ANNONCE } from "@/lib/traversee/data";
import { marquerAnnoncesVues } from "@/app/(app)/annonces/actions";
import type { MessageNonLu } from "@/app/api/messages/non-lus/route";
import type { AnnonceVue } from "@/lib/annonces";
import type { NotifRdv } from "@/lib/rendezvous";
import { notificationsAdmin, notificationsParticipant, type CompteRecent, type Notif } from "@/lib/traversee/notifications";
import { setTraversee, useTraversee, type Annonce, type TypeNotif } from "@/lib/traversee/store";
import { BellIcon, CalendarDaysIcon, CameraIcon, CheckIcon, GiftIcon, ImageIcon, MegaphoneIcon, MessageCircleIcon, TrophyIcon, UserPlusIcon, VideoIcon, type IconProps } from "./icons";
import { ClochePleine } from "./iconesNav";
import styles from "./notifications.module.css";

const TYPES: Record<TypeNotif, { icone: (p: IconProps) => JSX.Element; classe: string }> = {
  annonce: { icone: MegaphoneIcon, classe: "tAnnonce" },
  message: { icone: MessageCircleIcon, classe: "tMessage" },
  compte: { icone: UserPlusIcon, classe: "tCompte" },
  publication: { icone: ImageIcon, classe: "tPublication" },
  story: { icone: CameraIcon, classe: "tStory" },
  defi1: { icone: TrophyIcon, classe: "tDefi1" },
  defi2: { icone: GiftIcon, classe: "tDefi2" },
  rdv: { icone: CalendarDaysIcon, classe: "tRdv" },
  livre: { icone: VideoIcon, classe: "tLivre" },
};

function depuis(n: Notif, maintenant: number) {
  if (n.t === undefined) return n.quand ?? "";
  const min = Math.max(0, Math.round((maintenant - n.t) / 60_000));
  if (min < 1) return "À l’instant";
  if (min < 60) return `Il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Il y a ${h} h`;
  const j = Math.round(h / 24);
  if (j === 1) return "Hier";
  if (j < 7) return `Il y a ${j} jours`;
  return new Date(n.t).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function Notifications({ admin, annonces = [], rdv = [] }: { admin: boolean; annonces?: AnnonceVue[]; rdv?: NotifRdv[] }) {
  const pathname = usePathname();
  const s = useTraversee();
  const session = useSessionIdentity();
  const [ouvert, setOuvert] = useState(false);
  const [filtre, setFiltre] = useState<"toutes" | "nonlues">("toutes");
  const [maintenant, setMaintenant] = useState(0);
  const [comptes, setComptes] = useState<CompteRecent[]>([]);
  const [messages, setMessages] = useState<MessageNonLu[]>([]);
  const [annonce, setAnnonce] = useState<Annonce | null>(null);
  const [chemin, setChemin] = useState(pathname);
  const zone = useRef<HTMLDivElement | null>(null);

  if (chemin !== pathname) {
    setChemin(pathname);
    setOuvert(false);
  }

  const chargerMessages = useCallback(() => {
    fetch("/api/messages/non-lus", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<{ conversations?: MessageNonLu[] }>) : null))
      .then((d) => {
        if (d?.conversations) setMessages(d.conversations);
      })
      .catch(() => undefined);
  }, []);

  // Messages non lus : au chargement, à l'ouverture du panneau et toutes les 30 secondes.
  useEffect(() => {
    const premier = window.setTimeout(chargerMessages, 0);
    const id = window.setInterval(() => {
      if (!document.hidden) chargerMessages();
    }, 30_000);
    return () => {
      window.clearTimeout(premier);
      window.clearInterval(id);
    };
  }, [chargerMessages, pathname]);

  const charger = useCallback(() => {
    fetch("/api/admin/comptes-recents", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<{ comptes?: CompteRecent[] }>) : null))
      .then((d) => {
        if (d?.comptes) setComptes(d.comptes);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!admin) return;
    const id = window.setTimeout(charger, 0);
    return () => window.clearTimeout(id);
  }, [admin, charger]);

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

  const liste = useMemo(
    () => (admin ? notificationsAdmin(s, { comptes, moi: session?.id, messages }) : notificationsParticipant(s, { maintenant, creeLe: session?.createdAt, messages, annonces, rdv })),
    [admin, s, comptes, session, maintenant, messages, annonces, rdv],
  );
  const nonLues = liste.filter((n) => !n.lue);
  const visibles = filtre === "nonlues" ? nonLues : liste;
  const groupes = [
    { titre: "Nouvelles", items: visibles.filter((n) => !n.lue) },
    { titre: "Plus tôt", items: visibles.filter((n) => n.lue) },
  ].filter((g) => g.items.length);

  function basculer() {
    if (!ouvert) {
      setMaintenant(Date.now());
      if (admin) charger();
    }
    setOuvert((v) => !v);
  }

  function marquer(ns: Notif[]) {
    if (!ns.length) return;
    setTraversee((st) => ({
      notifsLues: { ...st.notifsLues, ...Object.fromEntries(ns.map((n) => [n.id, 1 as const])) },
    }));
    const vues = ns.flatMap((n) => (n.annonce ? [n.annonce.id] : []));
    if (vues.length) void marquerAnnoncesVues(vues);
  }

  function ouvrir(n: Notif) {
    marquer([n]);
    setOuvert(false);
    if (n.annonce) setAnnonce(n.annonce);
  }

  return (
    <div className={styles.zone} ref={zone}>
      <button
        type="button"
        className={`${styles.cloche} ${ouvert ? styles.actif : ""}`}
        onClick={basculer}
        aria-haspopup="dialog"
        aria-expanded={ouvert}
        aria-label={nonLues.length ? `Notifications, ${nonLues.length} non lue${nonLues.length > 1 ? "s" : ""}` : "Notifications"}
      >
        {ouvert ? <ClochePleine /> : <BellIcon />}
        {nonLues.length ? <b key={nonLues.length}>{nonLues.length > 9 ? "9+" : nonLues.length}</b> : null}
      </button>

      {ouvert ? (
        <div className={styles.panneau} role="dialog" aria-label="Notifications">
          <div className={styles.tete}>
            <h3>Notifications</h3>
            {nonLues.length ? (
              <button type="button" className={styles.toutLu} onClick={() => marquer(nonLues)}>
                <CheckIcon width={15} height={15} />
                Tout marquer comme lu
              </button>
            ) : null}
          </div>
          <div className={styles.filtres} role="tablist" aria-label="Filtrer les notifications">
            <button type="button" role="tab" aria-selected={filtre === "toutes"} className={filtre === "toutes" ? styles.filtreOn : ""} onClick={() => setFiltre("toutes")}>
              Toutes
            </button>
            <button type="button" role="tab" aria-selected={filtre === "nonlues"} className={filtre === "nonlues" ? styles.filtreOn : ""} onClick={() => setFiltre("nonlues")}>
              Non lues
              {nonLues.length ? <span>{nonLues.length}</span> : null}
            </button>
          </div>

          <div className={styles.liste}>
            {groupes.length ? (
              groupes.map((g) => (
                <section key={g.titre}>
                  <h4>{g.titre}</h4>
                  <ul>
                    {g.items.map((n, i) => {
                      const T = TYPES[n.type];
                      const contenu = (
                        <>
                          <span className={styles.visuel}>
                            {n.acteur ? (
                              <AvatarInitiales nom={n.acteur} size={48} />
                            ) : (
                              <span className={styles.sigle}>
                                <img src={SIGLE} alt="" />
                              </span>
                            )}
                            <span className={`${styles.pastille} ${styles[T.classe]}`}>
                              <T.icone width={13} height={13} />
                            </span>
                          </span>
                          <span className={styles.corps}>
                            <strong>{n.titre}</strong>
                            <span className={styles.texte}>{n.texte}</span>
                            <small>
                              {n.annonce ? `${TYPES_ANNONCE[n.annonce.type]} · ` : ""}
                              {depuis(n, maintenant)}
                            </small>
                          </span>
                          {!n.lue ? <i className={styles.point} aria-hidden /> : null}
                        </>
                      );
                      return (
                        <li key={n.id} style={{ "--i": i } as CSSProperties}>
                          {n.annonce ? (
                            <button type="button" className={`${styles.item} ${n.lue ? "" : styles.nonLue}`} onClick={() => ouvrir(n)}>
                              {contenu}
                            </button>
                          ) : (
                            <Link href={n.href} className={`${styles.item} ${n.lue ? "" : styles.nonLue}`} onClick={() => ouvrir(n)}>
                              {contenu}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))
            ) : (
              <div className={styles.vide}>
                <span>
                  <BellIcon width={28} height={28} />
                </span>
                <strong>{filtre === "nonlues" ? "Tout est lu" : "Aucune notification"}</strong>
                <p>{filtre === "nonlues" ? "Vous êtes à jour, rien de nouveau pour l’instant." : "Les messages, annonces et nouveautés apparaîtront ici."}</p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {annonce
        ? createPortal(
            <div className="theme-light">
              <Modal onClose={() => setAnnonce(null)} label="Annonce" size="narrow" className="!p-0 !overflow-hidden">
                <AnnonceCard annonce={annonce} onClose={() => setAnnonce(null)} />
              </Modal>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
