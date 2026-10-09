"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar } from "@/components/app/Avatar";
import { FacebookLogo, InstagramLogo } from "@/components/app/BrandLogos";
import { CheckIcon, CommentIcon, HeartIcon, PlayIcon, ShareIcon, SlidersIcon, XIcon } from "@/components/app/icons";
import { PageTitle } from "@/components/app/PageTitle";
import { StoryArt } from "@/components/stories/StoryArt";
import type { ChallengeSlug, ChallengeTheme } from "@/lib/mock/challenges";
import type { Network } from "@/lib/mock/social";
import styles from "./social.module.css";

export type SocialPostView = {
  id: string;
  network: Network;
  url: string;
  caption: string;
  image?: string;
  reactions: number;
  comments: number;
  shares: number;
  minutesAgo: number;
  when: string;
  author: { firstName: string; lastName: string; hue: number; online?: boolean; company: string; role: string };
  authorName: string;
  challenge: { slug: ChallengeSlug; number: number; title: string; theme: ChallengeTheme };
};

type SocialFeedProps = {
  posts: SocialPostView[];
  challenges: { slug: ChallengeSlug; number: number; title: string }[];
};

type NetworkFilter = "all" | Network;
type ChallengeFilter = "all" | ChallengeSlug;
type Sort = "recent" | "top";

const number = new Intl.NumberFormat("fr-FR");
const NETWORK_LABEL: Record<Network, string> = { facebook: "Facebook", instagram: "Instagram" };

function NetworkLogo({ network, size }: { network: Network; size: number }) {
  return network === "facebook" ? <FacebookLogo size={size} /> : <InstagramLogo size={size} />;
}

export function SocialFeed({ posts, challenges }: SocialFeedProps) {
  const [network, setNetwork] = useState<NetworkFilter>("all");
  const [challenge, setChallenge] = useState<ChallengeFilter>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const wrapRefs = useRef<(HTMLDivElement | null)[]>([]);

  const activeCount = (network !== "all" ? 1 : 0) + (challenge !== "all" ? 1 : 0) + (sort !== "recent" ? 1 : 0);

  const visible = useMemo(() => {
    const list = posts.filter((p) => (network === "all" || p.network === network) && (challenge === "all" || p.challenge.slug === challenge));
    return list.sort((a, b) => (sort === "top" ? b.reactions - a.reactions : a.minutesAgo - b.minutesAgo));
  }, [posts, network, challenge, sort]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      if (window.matchMedia("(min-width: 1024px)").matches && !wrapRefs.current.some((el) => el?.contains(e.target as Node))) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  function reset() {
    setNetwork("all");
    setChallenge("all");
    setSort("recent");
  }

  async function share(post: SocialPostView) {
    try {
      if (navigator.share) {
        await navigator.share({ title: `${post.authorName} · Défi ${post.challenge.number}`, url: post.url });
      } else {
        await navigator.clipboard.writeText(post.url);
        setToast("Lien de la publication copié");
      }
    } catch {
      return;
    }
  }

  const panel = (
    <div className={styles.panel} role="dialog" aria-modal="true" aria-label="Filtres">
      <div className={styles.handle} aria-hidden />
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="font-display text-[1.15rem] text-graphite">Filtres</p>
        <div className="flex items-center gap-2">
          {activeCount > 0 ? (
            <button type="button" onClick={reset} className="cursor-pointer text-[13px] font-semibold text-palm-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline">
              Réinitialiser
            </button>
          ) : null}
          <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-graphite-muted hover:bg-paper hover:text-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm">
            <XIcon width={18} height={18} />
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-5">
        <div className={styles.group} role="group" aria-label="Réseau">
          <p className={styles.groupLabel}>Réseau</p>
          <div className={styles.chips}>
            <button type="button" onClick={() => setNetwork("all")} aria-pressed={network === "all"} className={`${styles.chip} ${network === "all" ? styles.chipActive : ""}`}>Tous</button>
            {(["facebook", "instagram"] as Network[]).map((n) => (
              <button key={n} type="button" onClick={() => setNetwork(n)} aria-pressed={network === n} className={`${styles.chip} ${network === n ? styles.chipActive : ""}`}>
                <NetworkLogo network={n} size={16} />
                {NETWORK_LABEL[n]}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.group} role="group" aria-label="Défi">
          <p className={styles.groupLabel}>Défi</p>
          <div className={styles.chips}>
            <button type="button" onClick={() => setChallenge("all")} aria-pressed={challenge === "all"} className={`${styles.chip} ${challenge === "all" ? styles.chipActive : ""}`}>Tous</button>
            {challenges.map((c) => (
              <button key={c.slug} type="button" onClick={() => setChallenge(c.slug)} aria-pressed={challenge === c.slug} className={`${styles.chip} ${challenge === c.slug ? styles.chipActive : ""}`}>
                Défi {c.number}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.group} role="group" aria-label="Tri">
          <p className={styles.groupLabel}>Tri</p>
          <div className={styles.chips}>
            <button type="button" onClick={() => setSort("recent")} aria-pressed={sort === "recent"} className={`${styles.chip} ${sort === "recent" ? styles.chipActive : ""}`}>Plus récentes</button>
            <button type="button" onClick={() => setSort("top")} aria-pressed={sort === "top"} className={`${styles.chip} ${sort === "top" ? styles.chipActive : ""}`}>Plus de réactions</button>
          </div>
        </div>
        <button type="button" onClick={() => setOpen(false)} className={styles.apply}>
          Voir {visible.length} publication{visible.length > 1 ? "s" : ""}
        </button>
      </div>
    </div>
  );

  const filterButton = (slot: number) => (
    <div ref={(el) => { wrapRefs.current[slot] = el; }} className={styles.filterWrap}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="dialog" aria-expanded={open} className={`${styles.filterBtn} ${activeCount > 0 ? styles.filterBtnOn : ""}`}>
        <SlidersIcon width={18} height={18} />
        Filtres
        {activeCount > 0 ? <span className={styles.badge}>{activeCount}</span> : null}
      </button>
      {open ? panel : null}
    </div>
  );

  return (
    <>
      <PageTitle title="Réseaux sociaux" subtitle="Les publications des participants pour les défis, relevées sur Facebook et Instagram." actions={filterButton(0)} />
      <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
        <p className="text-[13px] text-graphite-muted">{visible.length} publication{visible.length > 1 ? "s" : ""}</p>
        {filterButton(1)}
      </div>
      {open ? <div className={styles.scrim} onClick={() => setOpen(false)} aria-hidden /> : null}

      <div className="mx-auto w-full max-w-2xl">
        {visible.length === 0 ? (
          <div className={styles.empty}>
            <p className="font-semibold text-graphite">Aucune publication pour ces filtres.</p>
            <button type="button" onClick={reset} className="mt-2 cursor-pointer text-[14px] font-semibold text-palm-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline">
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div key={`${network}-${challenge}-${sort}`} className={styles.feed}>
            {visible.map((p, i) => (
              <article key={p.id} id={p.id} className={styles.card} style={{ "--i": Math.min(i, 8) } as React.CSSProperties} aria-label={`Publication de ${p.authorName} sur ${NETWORK_LABEL[p.network]}`}>
                <header className={styles.head}>
                  <Avatar person={p.author} size={42} presence />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold leading-tight text-graphite">{p.authorName}</p>
                    <p className={styles.meta}>
                      <span>{p.when}</span>
                      <span aria-hidden>·</span>
                      <NetworkLogo network={p.network} size={14} />
                      <span>{NETWORK_LABEL[p.network]}</span>
                    </p>
                  </div>
                  <span className={styles.challenge}>Défi {p.challenge.number}</span>
                </header>

                <p className={styles.caption}>{p.caption}</p>

                <div className={styles.media}>
                  {p.image ? (
                    <img src={p.image} alt={`Photo publiée par ${p.authorName}`} loading="lazy" />
                  ) : (
                    <div className={styles.placeholder}>
                      <StoryArt theme={p.challenge.theme} hue={p.author.hue} seed={p.id} />
                      <span className={styles.play} aria-hidden>
                        <span className={styles.playDisc}><PlayIcon width={26} height={26} /></span>
                      </span>
                    </div>
                  )}
                </div>

                <div className={styles.counts}>
                  <span className="inline-flex items-center gap-2">
                    <span className={styles.heart} aria-hidden><HeartIcon width={11} height={11} fill="currentColor" strokeWidth={0} /></span>
                    <span className="font-semibold text-graphite">{number.format(p.reactions)}</span>
                  </span>
                  <span>
                    {number.format(p.comments)} commentaire{p.comments > 1 ? "s" : ""} · {number.format(p.shares)} partage{p.shares > 1 ? "s" : ""}
                  </span>
                </div>

                <div className={styles.actions}>
                  <a href={p.url} target="_blank" rel="noreferrer" className={`${styles.action} ${styles.actionPrimary}`}>
                    <HeartIcon width={18} height={18} />
                    Réagir
                  </a>
                  <a href={p.url} target="_blank" rel="noreferrer" className={styles.action}>
                    <CommentIcon width={18} height={18} />
                    Commenter
                  </a>
                  <button type="button" onClick={() => void share(p)} className={styles.action}>
                    <ShareIcon width={18} height={18} />
                    Partager
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {toast ? (
        <p role="status" className={styles.toast}>
          <CheckIcon width={14} height={14} className="mr-1.5 inline-block" style={{ color: "#4fd08a" }} />
          {toast}
        </p>
      ) : null}
    </>
  );
}
