"use client";

import Link from "next/link";
import { useId, useMemo, useState, type FormEvent } from "react";
import { Avatar } from "@/components/app/Avatar";
import { CameraIcon, MessageCircleIcon, SearchIcon, SendIcon, TrophyIcon } from "@/components/app/icons";
import appStyles from "@/components/app/app.module.css";
import { useProfile } from "@/components/profile/useProfile";
import { fullName, type Country } from "@/lib/mock/data";
import { PostCard, type FeedPost } from "./PostCard";
import styles from "./feed.module.css";

export type FeedPerson = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
  company: string;
  city: string;
  country: Country;
  sector: string;
  hue: number;
  online?: boolean;
  conversationId?: string;
};

type FeedProps = {
  me: { firstName: string; lastName: string; name: string; hue: number; role: string; company: string };
  posts: FeedPost[];
  people: FeedPerson[];
  initialQuery?: string;
  initialTab?: "posts" | "people";
};

const COUNTRY: Record<Country, string> = { MG: "Madagascar", CA: "Canada" };

export function Feed({ me, posts: initialPosts, people, initialQuery = "", initialTab = "posts" }: FeedProps) {
  const [tab, setTab] = useState<"posts" | "people">(initialTab);
  const [posts, setPosts] = useState(initialPosts);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState(initialQuery);
  const composerId = useId();
  const profile = useProfile();
  const meLive = { ...me, firstName: profile.firstName, lastName: profile.lastName, name: fullName(profile), photo: profile.photo };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter((p) => [p.name, p.company, p.role, p.city, p.sector].some((v) => v.toLowerCase().includes(q)));
  }, [people, query]);

  function publish(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setPosts((list) => [
      {
        id: `local-${Date.now()}`,
        author: { ...meLive },
        authorName: meLive.name,
        when: "à l'instant",
        text,
        likes: 0,
        comments: 0,
        liked: false,
        fresh: true,
      },
      ...list,
    ]);
    setDraft("");
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className={styles.tabs} role="tablist" aria-label="Fil de communauté">
        <button type="button" role="tab" aria-selected={tab === "posts"} onClick={() => setTab("posts")} className={`${styles.tab} ${tab === "posts" ? styles.tabActive : ""}`}>
          Publications
        </button>
        <button type="button" role="tab" aria-selected={tab === "people"} onClick={() => setTab("people")} className={`${styles.tab} ${tab === "people" ? styles.tabActive : ""}`}>
          Participants <span className="text-graphite-faint">· {people.length}</span>
        </button>
        <span className={`${styles.indicator} ${tab === "people" ? styles.indicatorRight : ""}`} aria-hidden />
      </div>

      {tab === "posts" ? (
        <div className={`${appStyles.stagger} flex flex-col gap-4`} role="tabpanel">
          <form onSubmit={publish} className={`${appStyles.card} p-3`} style={{ "--i": 0 } as React.CSSProperties}>
            <div className="flex items-start gap-3">
              <Avatar person={meLive} size={40} />
              <div className="min-w-0 flex-1">
                <label htmlFor={composerId} className="sr-only">Votre publication</label>
                <textarea
                  id={composerId}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={2}
                  placeholder="Partagez un moment du gala…"
                  className="w-full resize-none rounded-xl bg-paper px-3 py-2.5 text-[15px] leading-6 text-graphite placeholder:text-graphite-faint focus:outline-none focus:ring-2 focus:ring-palm/50"
                />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 pl-[52px]">
              <button type="button" aria-label="Ajouter une photo" className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-graphite-muted hover:bg-paper hover:text-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm">
                <CameraIcon width={20} height={20} />
              </button>
              <button type="button" aria-label="Associer un défi" className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-graphite-muted hover:bg-gold-soft hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm">
                <TrophyIcon width={19} height={19} />
              </button>
              <button
                type="submit"
                disabled={!draft.trim()}
                className="ml-auto flex h-9 cursor-pointer items-center gap-2 rounded-full bg-palm px-4 text-[13px] font-semibold text-white transition-[background-color,transform] hover:bg-palm-deep active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm focus-visible:ring-offset-2"
              >
                <SendIcon width={15} height={15} />
                Publier
              </button>
            </div>
          </form>

          <section style={{ "--i": 1 } as React.CSSProperties}>
            <div className="mb-1 flex items-center justify-between px-1">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-graphite-muted">En ce moment</h2>
              <button type="button" onClick={() => setTab("people")} className="cursor-pointer text-[13px] font-semibold text-palm-ink underline-offset-4 hover:underline">
                Tous
              </button>
            </div>
            <ul className={styles.rail}>
              {people.filter((p) => p.online).map((p) => (
                <li key={p.id} className="flex w-[66px] shrink-0 flex-col items-center gap-1.5 text-center">
                  <Avatar person={p} size={54} presence className="ring-2 ring-palm/40 ring-offset-2 ring-offset-paper" />
                  <span className="w-full truncate text-[11.5px] font-medium text-graphite">{p.firstName}</span>
                </li>
              ))}
            </ul>
          </section>

          {posts.map((post, i) => (
            <div key={post.id} style={{ "--i": Math.min(i + 2, 8) } as React.CSSProperties}>
              <PostCard post={post} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3" role="tabpanel">
          <label className="relative block">
            <span className="sr-only">Rechercher un participant</span>
            <SearchIcon width={18} height={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-graphite-faint" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom, entreprise, secteur, ville…"
              className="h-11 w-full rounded-full border border-line bg-surface pl-10 pr-4 text-[15px] text-graphite placeholder:text-graphite-faint focus:border-palm focus:outline-none focus:ring-2 focus:ring-palm/30"
            />
          </label>

          {filtered.length === 0 ? (
            <p className={`${appStyles.card} p-6 text-center text-[14px] text-graphite-muted`}>Aucun participant ne correspond à « {query} ».</p>
          ) : (
            <ul className={`${appStyles.stagger} flex flex-col gap-2`}>
              {filtered.map((p, i) => (
                <li key={p.id} style={{ "--i": Math.min(i, 8) } as React.CSSProperties} className={`${appStyles.card} flex items-center gap-3 p-3`}>
                  <Avatar person={p} size={46} presence />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-graphite">{p.name}</p>
                    <p className="truncate text-[12.5px] text-graphite-muted">{p.role} · {p.company}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-graphite-faint">
                      <span className={`rounded-full px-1.5 py-px font-semibold ${p.country === "CA" ? "bg-leaf-soft text-leaf-ink" : "bg-palm-soft text-palm-ink"}`}>{COUNTRY[p.country]}</span>
                      {p.city} · {p.sector}
                    </p>
                  </div>
                  <Link
                    href={p.conversationId ? `/messages/${p.conversationId}` : "/messages"}
                    aria-label={`Écrire à ${p.name}`}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-palm-soft text-palm-ink transition-colors hover:bg-palm hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm"
                  >
                    <MessageCircleIcon width={19} height={19} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
