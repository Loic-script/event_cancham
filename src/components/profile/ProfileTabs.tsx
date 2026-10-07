"use client";

import { useState, type ReactNode } from "react";
import feedStyles from "@/components/feed/feed.module.css";

type TabId = "about" | "challenges" | "posts";

type ProfileTabsProps = {
  about: ReactNode;
  challenges: ReactNode;
  posts: ReactNode;
  counts: { challenges: ReactNode; posts: number };
};

const TABS: { id: TabId; label: string }[] = [
  { id: "about", label: "À propos" },
  { id: "challenges", label: "Défis" },
  { id: "posts", label: "Publications" },
];

export function ProfileTabs({ about, challenges, posts, counts }: ProfileTabsProps) {
  const [tab, setTab] = useState<TabId>("about");
  const index = TABS.findIndex((t) => t.id === tab);
  const panels: Record<TabId, ReactNode> = { about, challenges, posts };

  return (
    <div>
      <div className={feedStyles.tabs} style={{ gridTemplateColumns: "repeat(3, 1fr)" }} role="tablist" aria-label="Sections du profil">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`${feedStyles.tab} ${tab === t.id ? feedStyles.tabActive : ""} text-[14px]`}
          >
            {t.label}
            {t.id === "challenges" ? <span className="ml-1 text-graphite-faint">{counts.challenges}</span> : null}
            {t.id === "posts" ? <span className="ml-1 text-graphite-faint">{counts.posts}</span> : null}
          </button>
        ))}
        <span className={feedStyles.indicator} style={{ width: `${100 / TABS.length}%`, transform: `translateX(${index * 100}%)` }} aria-hidden />
      </div>
      <div key={tab} role="tabpanel" className={`${feedStyles.postIn} pt-4`}>
        {panels[tab]}
      </div>
    </div>
  );
}
