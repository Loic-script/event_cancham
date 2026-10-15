"use client";

import QRCode from "qrcode";
import { useEffect, useRef } from "react";
import { DIX_ANS, LIEN_INSCRIPTION, LIEU_LONG, LOGO_BLANC } from "@/lib/traversee/data";
import styles from "./defis.module.css";

type AfficheProps = { nom: string; ligne: string; photo?: string | null; onReady?: (canvas: HTMLCanvasElement) => void };

const cache: Record<string, Promise<HTMLImageElement | null>> = {};
function charge(src: string) {
  if (!cache[src]) {
    cache[src] = new Promise((ok) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => ok(null);
      i.src = src;
    });
  }
  return cache[src];
}

function rond(x: CanvasRenderingContext2D, a: number, b: number, w: number, h: number, r: number) {
  x.beginPath();
  x.moveTo(a + r, b);
  x.arcTo(a + w, b, a + w, b + h, r);
  x.arcTo(a + w, b + h, a, b + h, r);
  x.arcTo(a, b + h, a, b, r);
  x.arcTo(a, b, a + w, b, r);
  x.closePath();
}

function famille() {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-montserrat").trim();
  return v ? `${v}, Montserrat, sans-serif` : "Montserrat, sans-serif";
}

export async function dessineAffiche(cv: HTMLCanvasElement, nom: string, ligne: string, photo?: string | null) {
  const x = cv.getContext("2d");
  if (!x) return;
  const W = 1080;
  const H = 1080;
  const M = 56;
  const F = famille();
  const ajuste = (txt: string, poids: string, taille: number, max: number) => {
    do {
      x.font = `${poids} ${taille}px ${F}`;
      taille -= 2;
    } while (x.measureText(txt).width > max && taille > 16);
  };
  const polices = document.fonts?.load ? Promise.all([document.fonts.load(`800 110px ${F}`), document.fonts.load(`700 40px ${F}`)]).catch(() => undefined) : Promise.resolve(undefined);
  const [logo, dix, portrait] = await Promise.all([charge(LOGO_BLANC), charge(DIX_ANS), photo ? charge(photo) : Promise.resolve(null), polices]);

  const g = x.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#7a0a1c");
  g.addColorStop(0.22, "#ad0707");
  g.addColorStop(0.52, "#0f1d2c");
  g.addColorStop(0.82, "#0f5028");
  g.addColorStop(1, "#007140");
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  const halo = x.createRadialGradient(W / 2, 372, 40, W / 2, 372, 420);
  halo.addColorStop(0, "rgba(255,255,255,.22)");
  halo.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = halo;
  x.fillRect(0, 0, W, H);

  if (logo) {
    const lh = 132;
    x.drawImage(logo, M - 6, 34, (logo.width / logo.height) * lh, lh);
  }
  if (dix) {
    const th = 104;
    const tw = (dix.width / dix.height) * th;
    x.drawImage(dix, W - M - tw, 48, tw, th);
  }

  const cx = W / 2;
  const cy = 372;
  const R = 168;
  x.save();
  x.beginPath();
  x.arc(cx, cy, R, 0, Math.PI * 2);
  x.closePath();
  x.fillStyle = "#e9edf2";
  x.fill();
  x.clip();
  if (portrait) {
    const s = Math.max((2 * R) / portrait.width, (2 * R) / portrait.height);
    const pw = portrait.width * s;
    const ph = portrait.height * s;
    x.drawImage(portrait, cx - pw / 2, cy - ph / 2, pw, ph);
  } else {
    x.fillStyle = "#a9b4c2";
    x.beginPath();
    x.arc(cx, cy - 36, 66, 0, Math.PI * 2);
    x.fill();
    x.beginPath();
    x.ellipse(cx, cy + 138, 122, 108, 0, 0, Math.PI * 2);
    x.fill();
  }
  x.restore();
  x.lineWidth = 12;
  x.strokeStyle = "#ffffff";
  x.beginPath();
  x.arc(cx, cy, R + 6, 0, Math.PI * 2);
  x.stroke();

  x.textAlign = "center";
  x.textBaseline = "alphabetic";
  x.fillStyle = "#ffffff";
  ajuste("J’Y SERAI", "800", 112, W - 2 * M - 120);
  x.fillText("J’Y SERAI", cx, 655);
  const t = "La Traversée · Gala des 10 ans";
  x.font = `700 34px ${F}`;
  const tw2 = x.measureText(t).width + 64;
  x.fillStyle = "#ffffff";
  rond(x, cx - tw2 / 2, 684, tw2, 64, 32);
  x.fill();
  x.fillStyle = "#0f1d2c";
  x.fillText(t, cx, 728);
  x.fillStyle = "#ffffff";
  x.font = `600 30px ${F}`;
  x.fillText(`Vendredi 18 décembre 2026 · ${LIEU_LONG}`, cx, 800);

  const py = 846;
  x.fillStyle = "#ffffff";
  x.fillRect(0, py, W, H - py);
  const f = x.createLinearGradient(0, 0, W, 0);
  f.addColorStop(0, "#ad0707");
  f.addColorStop(1, "#007140");
  x.fillStyle = f;
  x.fillRect(0, py, W, 8);

  const q = 168;
  const qx = W - M - q;
  const qy = py + 36;
  const qr = QRCode.create(LIEN_INSCRIPTION, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const c = q / n;
  x.fillStyle = "#0f1d2c";
  for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) if (qr.modules.data[a * n + b]) x.fillRect(qx + b * c, qy + a * c, Math.ceil(c), Math.ceil(c));

  x.textAlign = "right";
  x.fillStyle = "#0f1d2c";
  x.font = `700 26px ${F}`;
  x.fillText("Inscrivez-vous", qx - 28, qy + 72);
  x.fillStyle = "#4f6072";
  x.font = `600 21px ${F}`;
  x.fillText("cancham.mg/la-traversee", qx - 28, qy + 106);

  const maxG = qx - 28 - 300 - M;
  x.textAlign = "left";
  x.fillStyle = "#0f1d2c";
  ajuste(nom, "800", 42, maxG);
  x.fillText(nom, M, py + 102);
  if (ligne) {
    x.fillStyle = "#4f6072";
    ajuste(ligne, "600", 27, maxG);
    x.fillText(ligne, M, py + 146);
  }
}

export function Affiche({ nom, ligne, photo, onReady }: AfficheProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    let actif = true;
    void dessineAffiche(cv, nom, ligne, photo).then(() => {
      if (actif) onReady?.(cv);
    });
    return () => {
      actif = false;
    };
  }, [nom, ligne, photo, onReady]);
  return <canvas ref={ref} width={1080} height={1080} className={styles.affiche} aria-label="Aperçu de votre photo J’y serai, format carré" />;
}

export function telechargeCanvas(cv: HTMLCanvasElement, nomFichier: string) {
  cv.toBlob((b) => {
    if (!b) return;
    const url = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomFichier;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  }, "image/png");
}
