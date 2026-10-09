"use client";

import { useState } from "react";
import { ExternalLinkIcon, SpinnerIcon } from "@/components/app/icons";
import type { ParsedLink } from "@/lib/social/links";

type PostEmbedProps = {
  link: Extract<ParsedLink, { ok: true }>;
  height?: number;
};

export function PostEmbed({ link, height = 460 }: PostEmbedProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="relative bg-white" style={{ height }}>
        {loaded ? null : (
          <span className="absolute inset-0 grid place-items-center text-graphite-muted">
            <SpinnerIcon width={26} height={26} className="animate-spin" />
          </span>
        )}
        <iframe
          key={link.embedSrc}
          src={link.embedSrc}
          title={`Aperçu de la publication ${link.label}`}
          loading="lazy"
          allow="encrypted-media; clipboard-write"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setLoaded(true)}
          className="h-full w-full border-0"
        />
      </div>
      <a
        href={link.url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-2 border-t border-line bg-paper px-3 py-2.5 text-[13px] font-semibold text-graphite hover:bg-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm"
      >
        <ExternalLinkIcon width={15} height={15} />
        Ouvrir sur {link.label}
      </a>
    </div>
  );
}
