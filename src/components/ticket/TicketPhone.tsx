"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CheckIcon, DownloadIcon, MaximizeIcon, ShareIcon, SunIcon, XIcon } from "@/components/app/icons";
import styles from "./ticket.module.css";

type TicketPhoneProps = {
  code: string;
  holder: string;
  eventName: string;
  edition: string;
  clock: string;
  qrSmall: ReactNode;
  qrLarge: ReactNode;
};

const btn =
  "flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl text-[14px] font-semibold transition-[background-color,transform,box-shadow] duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

function StatusIcons() {
  return (
    <span className={styles.statusIcons} aria-hidden>
      <svg width="14" height="11" viewBox="0 0 14 11" fill="currentColor">
        <rect x="0" y="7" width="2.5" height="4" rx="0.6" />
        <rect x="3.8" y="5" width="2.5" height="6" rx="0.6" />
        <rect x="7.6" y="2.5" width="2.5" height="8.5" rx="0.6" />
        <rect x="11.4" y="0" width="2.5" height="11" rx="0.6" />
      </svg>
      <svg width="15" height="11" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M1 4.2a10 10 0 0 1 14 0" />
        <path d="M3.9 7a6 6 0 0 1 8.2 0" />
        <circle cx="8" cy="10" r="1.3" fill="currentColor" stroke="none" />
      </svg>
      <svg width="22" height="11" viewBox="0 0 22 11" fill="currentColor">
        <rect x="0.75" y="0.75" width="18" height="9.5" rx="2.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <rect x="2.5" y="2.5" width="14.5" height="6" rx="1.2" />
        <rect x="20" y="3.5" width="1.6" height="4" rx="0.6" opacity="0.5" />
      </svg>
    </span>
  );
}

export function TicketPhone({ code, holder, eventName, edition, clock, qrSmall, qrLarge }: TicketPhoneProps) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

  async function share() {
    const text = `Billet ${eventName} · ${edition} · ${holder} · ${code}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Mon billet", text });
      } else {
        await navigator.clipboard.writeText(code);
        setToast("Code du billet copié");
      }
    } catch {
      return;
    }
  }

  function download() {
    const svg = document.getElementById("ticket-qr");
    if (!svg) return;
    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `billet-${code}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    setToast("QR code téléchargé");
  }

  return (
    <>
      <div className="mx-auto w-fit">
        <div className={styles.scene}>
          <div className={`${styles.phone} ${styles.back}`} aria-hidden>
            <span className={`${styles.key} ${styles.keyBackVol}`} />
            <span className={`${styles.key} ${styles.keyBackPower}`} />
            <div className={styles.cams}>
              <span />
              <span />
              <span />
            </div>
            <span className={styles.flash} />
          </div>

          <article className={`${styles.phone} ${styles.front}`} aria-label="Billet d'entrée">
            <span className={`${styles.key} ${styles.keyVol}`} aria-hidden />
            <span className={`${styles.key} ${styles.keyPower}`} aria-hidden />
            <div className={styles.screen}>
              <div className={styles.status} aria-hidden>
                <span>{clock}</span>
                <StatusIcons />
              </div>
              <span className={styles.hole} aria-hidden />

              <div className={styles.body}>
                <p className={styles.brand}>
                  <span>{eventName}</span>
                  <span>{edition}</span>
                </p>
                <button type="button" onClick={() => setOpen(true)} aria-label="Afficher le QR code en plein écran" className={styles.qrTap}>
                  {qrSmall}
                </button>
                <p className="font-mono text-[13px] tracking-[0.16em] text-graphite">{code}</p>
                <p className={`${styles.live} text-[12px] font-semibold text-palm-ink`}>Billet valide · entrée gala</p>
                <div className={styles.holder}>
                  <div className="min-w-0">
                    <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-graphite-faint">Titulaire</p>
                    <p className="mt-0.5 truncate font-display text-[16px] leading-tight text-graphite">{holder}</p>
                  </div>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-palm-soft text-palm-ink" aria-hidden>
                    <CheckIcon width={16} height={16} />
                  </span>
                </div>
              </div>

              <span className={styles.homeBar} aria-hidden />
              <div className={styles.shine} aria-hidden />
            </div>
          </article>
        </div>

        <div className="mt-7 flex w-full gap-2">
          <button type="button" onClick={() => setOpen(true)} className={`${btn} flex-1 bg-palm text-white shadow-[0_12px_28px_-14px_rgba(11,107,63,0.9)] hover:bg-palm-deep`}>
            <MaximizeIcon width={18} height={18} />
            Plein écran
          </button>
          <button type="button" onClick={share} aria-label="Partager le billet" className={`${btn} w-11 border border-line bg-surface text-graphite hover:bg-paper`}>
            <ShareIcon width={18} height={18} />
          </button>
          <button type="button" onClick={download} aria-label="Télécharger le QR code" className={`${btn} w-11 border border-line bg-surface text-graphite hover:bg-paper`}>
            <DownloadIcon width={18} height={18} />
          </button>
        </div>
      </div>

      {open ? (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Billet en plein écran">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fermer"
            className="absolute right-4 grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-paper text-graphite hover:bg-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm"
            style={{ top: "calc(16px + env(safe-area-inset-top))" }}
          >
            <XIcon width={22} height={22} />
          </button>
          <p className="flex items-center gap-2 text-[13px] font-medium text-graphite-muted">
            <SunIcon width={16} height={16} />
            Mettez la luminosité au maximum
          </p>
          <div className={styles.overlayQr}>{qrLarge}</div>
          <p className="font-mono text-[18px] tracking-[0.16em] text-graphite">{code}</p>
          <p className="text-[15px] text-graphite-muted">{holder}</p>
        </div>
      ) : null}

      {toast ? (
        <p role="status" className={styles.toast}>
          {toast}
        </p>
      ) : null}
    </>
  );
}
