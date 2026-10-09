"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/app/Avatar";
import { FacebookLogo, InstagramLogo } from "@/components/app/BrandLogos";
import { CheckIcon, CommentIcon, HeartIcon, PlayIcon, ShareIcon } from "@/components/app/icons";
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
  when: string;
  author: { firstName: string; lastName: string; hue: number; online?: boolean; company: string; role: string };
  authorName: string;
  challenge: { slug: ChallengeSlug; number: number; title: string; theme: ChallengeTheme };
};

const number = new Intl.NumberFormat("fr-FR");

const NETWORK_LABEL: Record<Network, string> = { facebook: "Facebook", instagram: "Instagram" };

function NetworkLogo({ network, size }: { network: Network; size: number }) {
  return network === "facebook" ? <FacebookLogo size={size} /> : <InstagramLogo size={size} />;
}

export function SocialFeed({ posts }: { posts: SocialPostView[] }) {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

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

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className={styles.feed}>
        {posts.map((p, i) => (
          <article key={p.id} className={styles.card} style={{ "--i": Math.min(i, 8) } as React.CSSProperties} aria-label={`Publication de ${p.authorName} sur ${NETWORK_LABEL[p.network]}`}>
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

      {toast ? (
        <p role="status" className={styles.toast}>
          <CheckIcon width={14} height={14} className="mr-1.5 inline-block" style={{ color: "#4fd08a" }} />
          {toast}
        </p>
      ) : null}
    </div>
  );
}
