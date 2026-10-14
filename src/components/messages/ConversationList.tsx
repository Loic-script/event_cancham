"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/app/Avatar";
import { PencilIcon, SearchIcon } from "@/components/app/icons";
import styles from "./messages.module.css";

export type ConversationItem = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  hue: number;
  online?: boolean;
  company: string;
  lastText: string;
  lastFromMe: boolean;
  lastWhen: string;
  unread: number;
};

type ConversationListProps = {
  items: ConversationItem[];
  activeId?: string;
  base?: string;
};

export function ConversationList({ items, activeId, base = "/messages" }: ConversationListProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <div className="flex h-full flex-col">
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
        <button
          type="button"
          aria-label="Nouveau message"
          className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full bg-leaf text-white transition-colors hover:bg-leaf-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          <PencilIcon width={18} height={18} />
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="px-3 py-8 text-center text-[14px] text-graphite-muted">Aucune conversation pour « {query} ».</p>
      ) : (
        <ul className="flex flex-col gap-0.5 overflow-y-auto">
          {filtered.map((c) => {
            const active = c.id === activeId;
            return (
              <li key={c.id}>
                <Link href={`${base}/${c.id}`} className={`${styles.item} ${active ? styles.itemActive : ""}`} aria-current={active ? "page" : undefined}>
                  <Avatar person={c} size={52} presence />
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
                      {c.unread > 0 ? (
                        <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-leaf px-1.5 text-[11px] font-bold text-white">{c.unread}</span>
                      ) : null}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
