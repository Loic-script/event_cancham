"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

type Props = {
  src: string | null;
  /** Cadrage vertical, 0 (haut de l'image) à 100 (bas). */
  position: number;
  /** Mode réglage : on fait glisser l'image verticalement (ou flèches haut et bas au clavier). */
  reglage: boolean;
  onChange: (position: number) => void;
  className?: string;
  style?: CSSProperties;
  label: string;
  children?: ReactNode;
};

/** Bannière de couverture affichée en « cover », dont on peut régler le cadrage vertical en la faisant glisser. */
export function CouvertureReglable({ src, position, reglage, onChange, className = "", style, label, children }: Props) {
  const boite = useRef<HTMLDivElement | null>(null);
  // Hauteur dont l'image affichée dépasse la boîte : la course du réglage, en pixels.
  const [debordement, setDebordement] = useState(0);
  const glisse = useRef<{ y: number; position: number } | null>(null);

  useEffect(() => {
    if (!src || !reglage) return;
    let actif = true;
    const img = new Image();
    img.onload = () => {
      const b = boite.current;
      if (!actif || !b) return;
      const { width, height } = b.getBoundingClientRect();
      const echelle = Math.max(width / img.naturalWidth, height / img.naturalHeight);
      setDebordement(Math.max(0, img.naturalHeight * echelle - height));
    };
    img.src = src;
    return () => {
      actif = false;
    };
  }, [src, reglage]);

  const borne = (p: number) => Math.round(Math.min(100, Math.max(0, p)));

  function debut(e: PointerEvent<HTMLDivElement>) {
    if (!reglage || !debordement || (e.target as HTMLElement).closest("button, a, label")) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    glisse.current = { y: e.clientY, position };
  }

  function mouvement(e: PointerEvent<HTMLDivElement>) {
    const g = glisse.current;
    if (!g || !debordement) return;
    // Glisser vers le bas fait descendre l'image : on voit davantage son haut.
    onChange(borne(g.position - ((e.clientY - g.y) / debordement) * 100));
  }

  function fin(e: PointerEvent<HTMLDivElement>) {
    if (!glisse.current) return;
    glisse.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  }

  function clavier(e: KeyboardEvent<HTMLDivElement>) {
    if (!reglage) return;
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(borne(position + (e.key === "ArrowUp" ? -5 : 5)));
    }
  }

  return (
    <div
      ref={boite}
      className={className}
      style={{ ...style, backgroundImage: src ? `url(${src})` : undefined, backgroundPosition: `center ${position}%`, cursor: reglage && debordement ? "ns-resize" : undefined, touchAction: reglage ? "none" : undefined }}
      role={reglage ? "slider" : "img"}
      aria-label={reglage ? `${label} : glissez pour régler le cadrage` : label}
      aria-valuemin={reglage ? 0 : undefined}
      aria-valuemax={reglage ? 100 : undefined}
      aria-valuenow={reglage ? position : undefined}
      tabIndex={reglage ? 0 : undefined}
      onPointerDown={debut}
      onPointerMove={mouvement}
      onPointerUp={fin}
      onPointerCancel={fin}
      onKeyDown={clavier}
    >
      {children}
    </div>
  );
}
