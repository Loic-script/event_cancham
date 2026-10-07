"use client";

import { useEffect, useState, type ReactNode } from "react";
import { DownloadIcon, MaximizeIcon, ShareIcon, SunIcon, XIcon } from "@/components/app/icons";
import styles from "./ticket.module.css";

type TicketStubProps = {
  code: string;
  holder: string;
  /** QR code rendu côté serveur, taille billet. */
  qrSmall: ReactNode;
  /** Même QR code, grande taille, pour le mode plein écran. */
  qrLarge: ReactNode;
};

const btn =
  "flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl text-[14px] font-semibold transition-[background-color,transform,box-shadow] duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

// Partie basse du billet : le QR code (tactile), le code, l'état et les actions.
// Le plein écran, le partage et le téléchargement vivent ici car ils partagent le même état.
export function TicketStub({ code, holder, qrSmall, qrLarge }: TicketStubProps) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Plein écran : Échap pour fermer, et la page derrière ne défile plus.
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
    const text = `Billet La Traversée · Gala des 10 ans · ${holder} · ${code}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Mon billet", text });
      } else {
        await navigator.clipboard.writeText(code);
        setToast("Code du billet copié");
      }
    } catch {
      /* partage annulé par la personne : rien à faire */
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
      <div className="flex flex-col items-center gap-3 px-6 pb-6 pt-6">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Afficher le QR code en plein écran"
          className={`${styles.qrTap} rounded-2xl bg-white p-3 ring-1 ring-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm`}
        >
          {qrSmall}
        </button>
        <p className="font-mono text-[15px] tracking-[0.18em] text-graphite">{code}</p>
        <p className={`${styles.live} text-[12px] font-semibold text-palm-ink`}>Billet valide · entrée gala</p>

        <div className="mt-2 flex w-full gap-2">
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
