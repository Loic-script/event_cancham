"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/app/Avatar";
import { HeadsetIcon, PencilIcon, SearchIcon, XIcon } from "@/components/app/icons";
import type { ConversationResume } from "@/lib/messagerie";
import styles from "./messages.module.css";

export type ConversationItem = ConversationResume;
export type Contact = { id: number; name: string; company: string; photo?: string };

type ConversationListProps = {
  items: ConversationItem[];
  activeId?: string;
  base?: string;
  /** Personnes à qui écrire (bouton crayon) ; l'adresse est `${lienContact}/${id}`. */
  contacts?: Contact[];
  lienContact?: string;
  /** Adresse de la conversation avec l'équipe CanCham (côté participant). */
  equipeHref?: string;
};

export function ConversationList({ items, activeId, base = "/messages", contacts = [], lienContact, equipeHref }: ConversationListProps) {
  const [query, setQuery] = useState("");
  const [choix, setChoix] = useState(false);
  const [recherche, setRecherche] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q));
  }, [items, query]);

  const contactsFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return q ? contacts.filter((c) => c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q)) : contacts;
  }, [contacts, recherche]);

  const peutEcrire = Boolean(lienContact) && (contacts.length > 0 || Boolean(equipeHref));

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex items-center gap-2 pb-3">
        <label className="relative block flex-1">
          <span className="sr-only">Rechercher une conversation</span>
          <SearchIcon width={18} height={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-graphite-faint" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher"
            className="h-11 w-full rounded-full border border-line bg-surface pl-10 pr-4 text-[15px] text-graphite placeholder:text-graphite-faint focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
        </label>
        {peutEcrire ? (
          <button
            type="button"
            aria-label="Nouveau message"
            aria-expanded={choix}
            onClick={() => setChoix((v) => !v)}
            className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full bg-leaf text-white transition-colors hover:bg-leaf-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          >
            {choix ? <XIcon width={18} height={18} /> : <PencilIcon width={18} height={18} />}
          </button>
        ) : null}
      </div>

      {choix ? (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <p className="px-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-graphite-faint">Nouveau message</p>
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un participant"
            aria-label="Rechercher un participant"
            autoFocus
            className="h-10 w-full rounded-full border border-line bg-surface px-4 text-[14px] text-graphite placeholder:text-graphite-faint focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
          <ul className="flex flex-col gap-0.5 overflow-y-auto">
            {equipeHref && !recherche.trim() ? (
              <li>
                <Link href={equipeHref} className={styles.item}>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-leaf-soft text-leaf">
                    <HeadsetIcon width={20} height={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-graphite">Équipe CanCham</span>
                    <span className="block truncate text-[13px] text-graphite-muted">Une question sur La Traversée</span>
                  </span>
                </Link>
              </li>
            ) : null}
            {contactsFiltres.map((c) => (
              <li key={c.id}>
                <Link href={`${lienContact}/${c.id}`} className={styles.item}>
                  <Avatar person={{ firstName: c.name, lastName: "", hue: 0, photo: c.photo }} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-graphite">{c.name}</span>
                    <span className="block truncate text-[13px] text-graphite-muted">{c.company || "Participant"}</span>
                  </span>
                </Link>
              </li>
            ))}
            {!contactsFiltres.length && recherche.trim() ? <p className="px-3 py-6 text-center text-[14px] text-graphite-muted">Aucun participant pour « {recherche} ».</p> : null}
          </ul>
        </div>
      ) : (
        <>
          {equipeHref && !items.some((c) => c.equipe) && !query.trim() ? (
            <Link href={equipeHref} className={`${styles.item} mb-1`}>
              <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-leaf-soft text-leaf">
                <HeadsetIcon width={22} height={22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-graphite">Équipe CanCham</span>
                <span className="block truncate text-[13.5px] text-graphite-muted">Une question ? Écrivez-nous ici.</span>
              </span>
            </Link>
          ) : null}
          {filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-[14px] text-graphite-muted">
              {query.trim() ? `Aucune conversation pour « ${query} ».` : peutEcrire ? "Aucune conversation pour l’instant. Touchez le crayon pour écrire à un participant." : "Aucune conversation pour l’instant."}
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5 overflow-y-auto">
              {filtered.map((c) => {
                const active = c.id === activeId;
                return (
                  <li key={c.id}>
                    <Link href={`${base}/${c.id}`} className={`${styles.item} ${active ? styles.itemActive : ""}`} aria-current={active ? "page" : undefined}>
                      <Avatar person={c} size={52} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className={`truncate text-[15px] ${c.unread ? "font-bold text-graphite" : "font-semibold text-graphite"}`}>{c.name}</span>
                          <span className={`shrink-0 text-[12px] ${c.unread ? "font-semibold text-gold" : "text-graphite-faint"}`}>{c.lastWhen}</span>
                        </span>
                        <span className="flex items-center justify-between gap-2">
                          <span className={`truncate text-[13.5px] ${c.unread ? "font-medium text-graphite" : "text-graphite-muted"}`}>
                            {c.lastFromMe ? "Vous : " : ""}
                            {c.lastText}
                          </span>
                          {c.unread > 0 ? <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-leaf px-1.5 text-[11px] font-bold text-white">{c.unread}</span> : null}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
