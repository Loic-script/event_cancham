"use client";

import { useState } from "react";
import { Avatar } from "@/components/app/Avatar";
import { CommentIcon, HeartIcon, ShareIcon, TrophyIcon } from "@/components/app/icons";
import appStyles from "@/components/app/app.module.css";
import type { PostTag } from "@/lib/mock/data";
import styles from "./feed.module.css";

export type FeedPost = {
  id: string;
  author: { firstName: string; lastName: string; hue: number; online?: boolean; role: string; company: string };
  authorName: string;
  when: string;
  text: string;
  likes: number;
  comments: number;
  liked: boolean;
  tag?: PostTag;
  challenge?: string;
  fresh?: boolean;
};

const TAG_STYLE: Record<PostTag, { label: string; className: string }> = {
  gala: { label: "Gala", className: "bg-leaf-soft text-leaf-ink" },
  défi: { label: "Défi", className: "bg-gold-soft text-gold" },
  réseau: { label: "Réseau", className: "bg-palm-soft text-palm-ink" },
};

const action =
  "flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm";

export function PostCard({ post }: { post: FeedPost }) {
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [pop, setPop] = useState(false);

  function toggleLike() {
    setLiked((v) => !v);
    setLikes((n) => (liked ? n - 1 : n + 1));
    setPop(true);
  }

  const tag = post.tag ? TAG_STYLE[post.tag] : null;

  return (
    <article className={`${appStyles.card} ${post.fresh ? styles.postIn : ""} m-bleed p-4`}>
      <header className="flex items-start gap-3">
        <Avatar person={post.author} size={42} presence />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-tight text-graphite">{post.authorName}</p>
          <p className="truncate text-[12.5px] text-graphite-muted">
            {post.author.role} · {post.author.company}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <time className="text-[12px] text-graphite-faint">{post.when}</time>
          {tag ? <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tag.className}`}>{tag.label}</span> : null}
        </div>
      </header>

      {post.challenge ? (
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-gold-soft px-3 py-2 text-[13px] font-semibold text-gold">
          <TrophyIcon width={16} height={16} />
          {post.challenge}
        </p>
      ) : null}

      <p className="mt-3 whitespace-pre-line text-[15px] leading-6 text-graphite">{post.text}</p>

      <footer className="mt-3 flex items-center gap-1 border-t border-line pt-2">
        <button
          type="button"
          onClick={toggleLike}
          aria-pressed={liked}
          aria-label={liked ? "Ne plus aimer" : "Aimer"}
          className={`${action} ${liked ? "text-leaf-ink" : "text-graphite-muted hover:bg-leaf-soft hover:text-leaf-ink"}`}
        >
          <HeartIcon
            width={19}
            height={19}
            fill={liked ? "currentColor" : "none"}
            className={pop ? styles.heartPop : undefined}
            onAnimationEnd={() => setPop(false)}
          />
          <span>{likes}</span>
        </button>
        <button type="button" className={`${action} text-graphite-muted hover:bg-palm-soft hover:text-palm-ink`}>
          <CommentIcon width={18} height={18} />
          <span>{post.comments}</span>
        </button>
        <button type="button" aria-label="Partager" className={`${action} ml-auto text-graphite-muted hover:bg-paper hover:text-graphite`}>
          <ShareIcon width={18} height={18} />
        </button>
      </footer>
    </article>
  );
}
