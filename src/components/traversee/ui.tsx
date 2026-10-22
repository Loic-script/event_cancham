import Link from "next/link";
import { Avatar } from "@/components/app/Avatar";
import type { ButtonHTMLAttributes, CSSProperties, InputHTMLAttributes, ReactNode } from "react";
import { IMG, SIGLE } from "@/lib/traversee/data";
import styles from "./traversee.module.css";

export const ui = styles;

type PageHeadProps = { title: string; accent: string; text?: string; photo: string; children?: ReactNode };

export function PageHead({ title, accent, text, photo, children }: PageHeadProps) {
  return (
    <div className={`${styles.head} m-bleed`} style={{ "--ph": `url(${IMG(photo)})` } as CSSProperties}>
      <div>
        <h1>
          {title} <em>{accent}</em>
        </h1>
        {text ? <p>{text}</p> : null}
      </div>
      {children ? <div className={styles.headRight}>{children}</div> : null}
    </div>
  );
}

export function Card({ children, className = "", pad = false, bleed = false, style }: { children: ReactNode; className?: string; pad?: boolean; bleed?: boolean; style?: CSSProperties }) {
  return (
    <div className={`${styles.card} ${pad ? styles.pad : ""} ${bleed ? "m-bleed" : ""} ${className}`} style={style}>
      {children}
    </div>
  );
}

export function Sur({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`${styles.sur} ${className}`}>{children}</p>;
}

type Tone = "blue" | "red" | "green" | "grey" | "white";
const TONES: Record<Tone, string> = { blue: "", red: styles.puceRed, green: styles.puceGreen, grey: styles.puceGrey, white: styles.puceWhite };

export function Puce({ children, tone = "blue", className = "" }: { children: ReactNode; tone?: Tone; className?: string }) {
  return <span className={`${styles.puce} ${TONES[tone]} ${className}`}>{children}</span>;
}

type Variant = "primary" | "green" | "navy" | "light" | "ghost";
const VARIANTS: Record<Variant, string> = { primary: styles.btnPrimary, green: styles.btnGreen, navy: styles.btnNavy, light: styles.btnLight, ghost: styles.btnGhost };

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; small?: boolean; href?: string; external?: boolean };

export function Btn({ variant = "light", small = false, href, external, className = "", children, ...rest }: BtnProps) {
  const cls = `${styles.btn} ${VARIANTS[variant]} ${small ? styles.btnSmall : ""} ${className}`;
  if (href) {
    if (external) {
      return (
        <a href={href} target={href.startsWith("/") ? undefined : "_blank"} rel={href.startsWith("/") ? undefined : "noreferrer"} className={cls}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}

type FileBtnProps = InputHTMLAttributes<HTMLInputElement> & { variant?: Variant; small?: boolean; label: ReactNode; className?: string };

export function FileBtn({ variant = "light", small = false, label, className = "", ...input }: FileBtnProps) {
  return (
    <span className={`${styles.btn} ${VARIANTS[variant]} ${small ? styles.btnSmall : ""} ${styles.file} ${className}`}>
      {label}
      <input type="file" {...input} />
    </span>
  );
}

export function Stat({ label, value, text, children }: { label: string; value: ReactNode; text?: ReactNode; children?: ReactNode }) {
  return (
    <div className={`${styles.card} ${styles.pad} ${styles.stat}`}>
      <Sur>{label}</Sur>
      <b>{value}</b>
      {text ? <span>{text}</span> : null}
      {children}
    </div>
  );
}

export type Etape = { titre: string; fait: boolean; detail?: string; href?: string; action?: string };

export function Etapes({ items }: { items: Etape[] }) {
  return (
    <ul className={styles.liste}>
      {items.map((e) => (
        <li key={e.titre}>
          <span className={e.fait ? styles.fait : styles.afaire}>{e.fait ? "✓" : ""}</span>
          <div className="min-w-0 flex-1">
            <strong>{e.titre}</strong>
            {e.detail ? <small>{e.detail}</small> : null}
          </div>
          {!e.fait && e.href ? (
            <Btn href={e.href} small variant={e.action ? "primary" : "light"}>
              {e.action ?? "Faire"}
            </Btn>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function Jauge({ pct, className = "" }: { pct: number; className?: string }) {
  return (
    <div className={`${styles.jauge} ${className}`}>
      <i style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

export function Onglets<T extends string>({ items, value, onChange, label }: { items: { v: T; label: string; disabled?: boolean }[]; value: T; onChange: (v: T) => void; label?: string }) {
  return (
    <div className={styles.onglets} role="tablist" aria-label={label}>
      {items.map((it) => (
        <button key={it.v} type="button" role="tab" aria-selected={value === it.v} disabled={it.disabled} onClick={() => onChange(it.v)} className={value === it.v ? styles.on : ""}>
          {it.label}
        </button>
      ))}
    </div>
  );
}

export function Recherche({ value, onChange, placeholder, label, className = "" }: { value: string; onChange: (v: string) => void; placeholder: string; label: string; className?: string }) {
  return (
    <label className={`${styles.recherche} ${className}`}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={label} />
    </label>
  );
}

export function Champ({ label, htmlFor, children, hint }: { label: ReactNode; htmlFor?: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className={styles.champ}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint ? <small className="text-[12.5px] text-graphite-muted">{hint}</small> : null}
    </div>
  );
}

export function Note({ children, tone = "blue", className = "" }: { children: ReactNode; tone?: "blue" | "red" | "green"; className?: string }) {
  return <div className={`${styles.note} ${tone === "red" ? styles.noteRed : tone === "green" ? styles.noteGreen : ""} ${className}`}>{children}</div>;
}

export function Vide({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`${styles.card} ${styles.vide} ${className}`}>{children}</div>;
}

export function Partie({ n, titre, children }: { n: number; titre: string; children: ReactNode }) {
  return (
    <section className={styles.partie}>
      <h2>
        <span>{n}</span>
        {titre}
      </h2>
      {children}
    </section>
  );
}

export function Rang({ n }: { n: number }) {
  return <span className={styles.rang}>{n}</span>;
}

export function Direct({ children }: { children: ReactNode }) {
  return <span className={styles.direct}>{children}</span>;
}

export function AvatarInitiales({ nom, photo, size = 38, className = "" }: { nom: string; photo?: string | null; size?: number; className?: string }) {
  return (
    <span className={`${styles.av} ${className}`} style={{ width: size, height: size, fontSize: Math.round(size * 0.37), backgroundImage: photo ? `url(${photo})` : undefined }} aria-hidden>
      {photo ? "" : nom.split(/\s+/).filter(Boolean).slice(0, 2).map((m) => m[0]?.toUpperCase()).join("") || "?"}
    </span>
  );
}

/** Photo de profil ronde (ou silhouette par défaut), sans anneau. */
export function AvatarProfil({ photo, size = 40, className = "" }: { photo?: string | null; size?: number; className?: string }) {
  return (
    <span className={`${styles.anneau} ${className}`} aria-hidden>
      <Avatar person={{ firstName: "", lastName: "", photo: photo ?? undefined }} size={size} />
    </span>
  );
}

export function AvatarSigle({ size = 38 }: { size?: number }) {
  return (
    <span className={`${styles.av} ${styles.avSigle}`} style={{ width: size, height: size }} aria-hidden>
      <img src={SIGLE} alt="" />
    </span>
  );
}
