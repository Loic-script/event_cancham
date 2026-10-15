"use client";

import type { CSSProperties, ReactNode } from "react";
import { integration, type Bloc, type Run } from "@/lib/ressources/blocs";
import styles from "./bibliotheque.module.css";

const TAILLES = { petit: styles.petit, grand: styles.grand, "tres-grand": styles.tresGrand };

export function RunRendu({ r }: { r: Run }) {
  let n: ReactNode = r.t;
  if (r.s) n = <s>{n}</s>;
  if (r.i) n = <em>{n}</em>;
  if (r.b) n = <strong>{n}</strong>;
  if (r.couleur || r.taille) {
    n = (
      <span className={r.taille ? TAILLES[r.taille] : undefined} style={r.couleur ? { color: r.couleur } : undefined}>
        {n}
      </span>
    );
  }
  if (r.lien) {
    n = (
      <a href={r.lien} target={r.lien.startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer nofollow">
        {n}
      </a>
    );
  }
  return <>{n}</>;
}

function Runs({ runs }: { runs: Run[] }) {
  if (!runs.length) return <br />;
  return (
    <>
      {runs.map((r, i) => (
        <RunRendu key={i} r={r} />
      ))}
    </>
  );
}

export function BlocsRendu({ blocs, fichier }: { blocs: Bloc[]; fichier: (nom: string) => string }) {
  return (
    <div className={styles.blocs}>
      {blocs.map((b) => {
        if (b.type === "titre") {
          const style: CSSProperties = { textAlign: b.align, color: b.couleur };
          return b.niveau === 2 ? (
            <h2 key={b.id} style={style}>
              {b.texte}
            </h2>
          ) : (
            <h3 key={b.id} style={style}>
              {b.texte}
            </h3>
          );
        }
        if (b.type === "texte") {
          return (
            <div key={b.id} className={styles.texteRiche}>
              {b.paragraphes.map((p, i) => {
                const style: CSSProperties = { textAlign: p.align ?? "left" };
                if (p.type === "p") {
                  return (
                    <p key={i} style={style}>
                      <Runs runs={p.items[0] ?? []} />
                    </p>
                  );
                }
                const Liste = p.type === "ol" ? "ol" : "ul";
                return (
                  <Liste key={i} style={style}>
                    {p.items.map((it, j) => (
                      <li key={j}>
                        <Runs runs={it} />
                      </li>
                    ))}
                  </Liste>
                );
              })}
            </div>
          );
        }
        if (b.type === "photo") {
          if (!b.fichier) return null;
          return (
            <figure key={b.id}>
              <img src={fichier(b.fichier)} alt={b.legende || ""} loading="lazy" draggable={false} />
              {b.legende ? <figcaption>{b.legende}</figcaption> : null}
            </figure>
          );
        }
        if (b.fichier) {
          return (
            <video
              key={b.id}
              className={styles.video}
              src={fichier(b.fichier)}
              controls
              controlsList="nodownload noremoteplayback"
              disablePictureInPicture
              disableRemotePlayback
              playsInline
              preload="metadata"
              onContextMenu={(e) => e.preventDefault()}
            />
          );
        }
        const integ = b.url ? integration(b.url) : null;
        if (!integ) return null;
        return (
          <div key={b.id} className={styles.integration}>
            <iframe src={integ.src} title={`Vidéo ${integ.fournisseur}`} loading="lazy" allow="encrypted-media; fullscreen" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
          </div>
        );
      })}
    </div>
  );
}
