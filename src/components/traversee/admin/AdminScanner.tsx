"use client";

import jsQR from "jsqr";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { CameraIcon, CheckIcon, QrIcon, TicketIcon, XIcon } from "@/components/app/icons";
import { currentUser, fullName } from "@/lib/mock/data";
import { fichesParticipants } from "@/lib/traversee/participants";
import { setTraversee, toast, useTraversee, type TraverseeState } from "@/lib/traversee/store";
import { Btn, Card, PageHead, Puce, Stat, Sur, ui } from "../ui";
import styles from "./scanner.module.css";

type Etat = "ok" | "attente" | "deja" | "inconnu";
type Verdict = { etat: Etat; code: string; nom?: string; ent?: string; role?: string; table?: string; quand?: string; t: number };

type Detecteur = { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
type FenetreDetecteur = Window & { BarcodeDetector?: new (o: { formats: string[] }) => Detecteur };

const TITRES: Record<Etat, string> = { ok: "Entrée validée", attente: "Paiement en attente", deja: "Déjà scanné", inconnu: "Billet inconnu" };
const CONSEILS: Record<Etat, string> = {
  ok: "Bonne soirée ! Orientez le participant vers sa table.",
  attente: "Le billet n’est pas réglé. Dirigez le participant vers la caisse avant l’entrée.",
  deja: "Ce billet est déjà entré. Vérifiez l’identité avant de laisser passer.",
  inconnu: "Aucun billet ne correspond. Vérifiez l’identifiant ou la billetterie.",
};

function heure(t: number) {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(t));
}

function normalise(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

function chercher(code: string, s: TraverseeState) {
  if (code === normalise(currentUser.ticket.code)) {
    return { nom: fullName(currentUser), ent: currentUser.company, role: currentUser.role, table: currentUser.ticket.table, billet: "paye" as const };
  }
  const f = fichesParticipants(s).find((x) => normalise(x.code) === code);
  return f ? { nom: f.nom, ent: f.ent, role: f.role, table: undefined, billet: f.billet } : null;
}

export function verifier(brut: string, s: TraverseeState): Verdict {
  const code = normalise(brut);
  const t = Date.now();
  const fiche = chercher(code, s);
  if (!fiche) return { etat: "inconnu", code, t };
  const deja = s.scans.find((x) => x.code === code);
  if (deja) return { etat: "deja", code, nom: fiche.nom, ent: fiche.ent, role: fiche.role, table: fiche.table, quand: heure(deja.t), t };
  if (fiche.billet !== "paye") return { etat: "attente", code, nom: fiche.nom, ent: fiche.ent, role: fiche.role, table: fiche.table, t };
  return { etat: "ok", code, nom: fiche.nom, ent: fiche.ent, role: fiche.role, table: fiche.table, t };
}

export function AdminScanner() {
  const s = useTraversee();
  const [actif, setActif] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [saisie, setSaisie] = useState("");
  const [moteur, setMoteur] = useState<"natif" | "jsqr" | null>(null);
  const video = useRef<HTMLVideoElement | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const flux = useRef<MediaStream | null>(null);
  const boucle = useRef<number | null>(null);
  const dernier = useRef<{ code: string; t: number }>({ code: "", t: 0 });
  const etatRef = useRef(s);
  useEffect(() => {
    etatRef.current = s;
  }, [s]);

  const inscrits = fichesParticipants(s).length + 1;
  const entres = s.scans.length;

  const traiter = useCallback((brut: string) => {
    const code = normalise(brut);
    if (!code) return;
    const now = Date.now();
    if (code === dernier.current.code && now - dernier.current.t < 4000) return;
    dernier.current = { code, t: now };
    const v = verifier(code, etatRef.current);
    setVerdict(v);
    if (v.etat === "ok") {
      setTraversee((st) => ({ scans: [{ code, nom: v.nom ?? code, t: now }, ...st.scans] }));
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(80);
    } else if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.([60, 60, 60]);
    }
  }, []);

  const arreter = useCallback(() => {
    if (boucle.current) window.clearTimeout(boucle.current);
    boucle.current = null;
    flux.current?.getTracks().forEach((t) => t.stop());
    flux.current = null;
    if (video.current) video.current.srcObject = null;
    setActif(false);
  }, []);

  async function demarrer() {
    setErreur(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setErreur("La caméra n’est pas disponible sur cet appareil. Saisissez l’identifiant du billet.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      flux.current = stream;
      const v = video.current;
      if (!v) return;
      v.srcObject = stream;
      await v.play();
      setActif(true);
      const w = window as FenetreDetecteur;
      const detecteur = w.BarcodeDetector ? new w.BarcodeDetector({ formats: ["qr_code"] }) : null;
      setMoteur(detecteur ? "natif" : "jsqr");
      const tick = async () => {
        if (!flux.current || !video.current || video.current.readyState < 2) {
          boucle.current = window.setTimeout(tick, 200);
          return;
        }
        try {
          if (detecteur) {
            const codes = await detecteur.detect(video.current);
            if (codes[0]?.rawValue) traiter(codes[0].rawValue);
          } else {
            const c = canvas.current;
            if (c) {
              const vw = video.current.videoWidth;
              const vh = video.current.videoHeight;
              const taille = Math.min(640, vw, vh);
              c.width = taille;
              c.height = taille;
              const ctx = c.getContext("2d", { willReadFrequently: true });
              if (ctx && vw && vh) {
                ctx.drawImage(video.current, (vw - taille) / 2, (vh - taille) / 2, taille, taille, 0, 0, taille, taille);
                const img = ctx.getImageData(0, 0, taille, taille);
                const r = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
                if (r?.data) traiter(r.data);
              }
            }
          }
        } catch {
          setErreur(null);
        }
        boucle.current = window.setTimeout(tick, 160);
      };
      tick();
    } catch (e) {
      const nom = e instanceof Error ? e.name : "";
      setErreur(nom === "NotAllowedError" ? "Accès à la caméra refusé. Autorisez la caméra dans le navigateur ou saisissez l’identifiant." : "Impossible d’ouvrir la caméra. Saisissez l’identifiant du billet.");
      arreter();
    }
  }

  useEffect(() => () => arreter(), [arreter]);

  function valider(e: FormEvent) {
    e.preventDefault();
    if (!saisie.trim()) return;
    dernier.current = { code: "", t: 0 };
    traiter(saisie);
    setSaisie("");
  }

  function reinitialiser() {
    setTraversee({ scans: [] });
    setVerdict(null);
    toast("Historique des scans effacé.");
  }

  return (
    <>
      <PageHead title="Scanner" accent="QR" text="À l’entrée du gala : visez le QR code du billet, la vérification est immédiate. Sans caméra, saisissez l’identifiant du billet." photo="accueil">
        <Puce tone="white">
          {entres} / {inscrits} entrés
        </Puce>
      </PageHead>

      <div className={styles.grille}>
          <Card bleed className={styles.camera}>
            <div className={`${styles.cadre} ${actif ? styles.cadreActif : ""} ${verdict ? styles[`cadre_${verdict.etat}`] : ""}`}>
              <video ref={video} className={styles.video} playsInline muted aria-label="Aperçu de la caméra" />
              <canvas ref={canvas} className="hidden" aria-hidden />
              <div className={styles.viseur} aria-hidden>
                <i />
                <i />
                <i />
                <i />
                {actif ? <span className={styles.laser} /> : null}
              </div>
              {!actif ? (
                <div className={styles.repos}>
                  <span className={styles.rondQr}>
                    <QrIcon width={34} height={34} />
                  </span>
                  <strong>Caméra en veille</strong>
                  <p>Activez la caméra pour scanner les billets.</p>
                  <Btn variant="primary" onClick={demarrer}>
                    <CameraIcon width={16} height={16} />
                    Activer la caméra
                  </Btn>
                </div>
              ) : null}
            </div>
            <div className={styles.barre}>
              {actif ? (
                <>
                  <span className={styles.etatCam}>
                    <i />
                    Lecture en cours{moteur === "jsqr" ? " · décodage logiciel" : ""}
                  </span>
                  <Btn small onClick={arreter}>
                    Arrêter
                  </Btn>
                </>
              ) : (
                <span className={styles.etatCamOff}>Pointez le QR code au centre du cadre, à 15 ou 20 cm.</span>
              )}
            </div>
            {erreur ? <p className={styles.erreur}>{erreur}</p> : null}
          </Card>
          {verdict ? (
            <div key={verdict.t} className={`${styles.verdict} ${styles[`verdict_${verdict.etat}`]}`} role="status" aria-live="polite">
              <span className={styles.verdictIco}>{verdict.etat === "ok" ? <CheckIcon width={30} height={30} strokeWidth={2.5} /> : verdict.etat === "inconnu" ? <XIcon width={30} height={30} strokeWidth={2.5} /> : <TicketIcon width={28} height={28} />}</span>
              <div className={styles.verdictTexte}>
                <small>{heure(verdict.t)}</small>
                <strong>{TITRES[verdict.etat]}</strong>
                {verdict.nom ? (
                  <p className={styles.verdictNom}>
                    {verdict.nom}
                    {verdict.role || verdict.ent ? <span> · {[verdict.role, verdict.ent].filter(Boolean).join(", ")}</span> : null}
                  </p>
                ) : null}
                <p className={styles.verdictCode}>
                  {verdict.code}
                  {verdict.table ? ` · Table ${verdict.table}` : ""}
                  {verdict.quand ? ` · entré à ${verdict.quand}` : ""}
                </p>
                <p>{CONSEILS[verdict.etat]}</p>
              </div>
            </div>
          ) : (
            <div className={`${styles.verdict} ${styles.verdictVide}`}>
              <span className={styles.verdictIco}>
                <QrIcon width={28} height={28} />
              </span>
              <div className={styles.verdictTexte}>
                <strong>En attente d’un billet</strong>
                <p>Le résultat de la vérification s’affiche ici, en grand, avec le nom du participant.</p>
              </div>
            </div>
          )}
          <form onSubmit={valider} className={`${ui.card} ${ui.pad} m-bleed ${styles.manuel}`}>
            <Sur className="!mb-0">Saisie manuelle</Sur>
            <label htmlFor="sc-code" className="sr-only">
              Identifiant du billet
            </label>
            <div className={styles.ligneSaisie}>
              <div className="relative min-w-0 flex-1">
                <TicketIcon width={17} height={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graphite-faint" />
                <input id="sc-code" className={`${ui.saisie} !pl-10 uppercase`} placeholder="TRV26-GALA-0000" autoComplete="off" autoCapitalize="characters" value={saisie} onChange={(e) => setSaisie(e.target.value)} />
              </div>
              <Btn variant="navy" type="submit">
                Vérifier
              </Btn>
            </div>
          </form>
          <div className={styles.stats}>
            <Stat label="Entrées validées" value={entres} text={`sur ${inscrits} inscrits`} />
            <Stat label="Taux de présence" value={`${Math.round((entres / inscrits) * 100)} %`} text="billets scannés" />
          </div>
          <Card pad bleed className={styles.histo}>
            <div className="flex items-center justify-between gap-3">
              <Sur className="!mb-0">Derniers scans</Sur>
              {s.scans.length ? (
                <Btn small variant="ghost" onClick={reinitialiser}>
                  Effacer
                </Btn>
              ) : null}
            </div>
            {s.scans.length ? (
              <ul className={styles.liste}>
                {s.scans.slice(0, 12).map((x, i) => (
                  <li key={`${x.code}-${x.t}`} style={{ "--i": Math.min(i, 8) } as React.CSSProperties}>
                    <span className={styles.coche}>
                      <CheckIcon width={14} height={14} strokeWidth={3} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <strong>{x.nom}</strong>
                      <small>{x.code}</small>
                    </div>
                    <time>{heure(x.t)}</time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.vide}>Aucune entrée validée pour l’instant.</p>
            )}
          </Card>
      </div>
    </>
  );
}
