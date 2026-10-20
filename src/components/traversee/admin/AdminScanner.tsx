"use client";

import jsQR from "jsqr";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  effacerEntrees,
  encaisserEtValider,
  scannerBillet,
} from "@/app/(app)/admin/scanner/actions";
import {
  CameraIcon,
  CheckIcon,
  QrIcon,
  TicketIcon,
  XIcon,
} from "@/components/app/icons";
import type { EntreeVue, EtatScan, VerdictScan } from "@/lib/billets";
import { toast } from "@/lib/traversee/store";
import { Confirmer } from "../Confirmer";
import {
  AvatarInitiales,
  Btn,
  Card,
  PageHead,
  Puce,
  Recherche,
  Sur,
  ui,
} from "../ui";
import styles from "./scanner.module.css";

type Etat = EtatScan;
/** Verdict renvoyé par le serveur, daté de la lecture (t) pour l'affichage. */
type Verdict = VerdictScan & { t: number };

type Detecteur = {
  detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
};
type FenetreDetecteur = Window & {
  BarcodeDetector?: new (o: { formats: string[] }) => Detecteur;
};

const TITRES: Record<Etat, string> = {
  ok: "Entrée validée",
  attente: "Paiement en attente",
  deja: "Déjà scanné",
  inconnu: "Billet inconnu",
};
const CONSEILS: Record<Etat, string> = {
  ok: "Bonne soirée ! Le participant peut entrer.",
  attente:
    "Le billet n’est pas réglé. Encaissez le paiement avant l’entrée, puis validez.",
  deja: "Ce billet est déjà entré. Vérifiez l’identité avant de laisser passer.",
  inconnu:
    "Aucun billet ne correspond, ou le compte n’est pas encore validé. Vérifiez l’identifiant.",
};

// Heure de Madagascar, quel que soit le fuseau de l'appareil qui scanne.
function heure(t: number) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Indian/Antananarivo",
  }).format(new Date(t));
}

function normalise(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function AdminScanner({
  entrees,
  inscrits,
}: {
  entrees: EntreeVue[];
  inscrits: number;
}) {
  const router = useRouter();
  const [actif, setActif] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [saisie, setSaisie] = useState("");
  const [moteur, setMoteur] = useState<"natif" | "jsqr" | null>(null);
  const [filtre, setFiltre] = useState("");
  const [masque, setMasque] = useState<number | null>(null);
  const [effacer, setEffacer] = useState(false);
  const [encaissement, setEncaissement] = useState(false);
  const video = useRef<HTMLVideoElement | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const flux = useRef<MediaStream | null>(null);
  const boucle = useRef<number | null>(null);
  const dernier = useRef<{ code: string; t: number }>({ code: "", t: 0 });
  const enCours = useRef(false);

  const entres = entrees.length;
  const total = Math.max(inscrits, entres, 1);
  const fl = filtre.trim().toLowerCase();
  const scannes = entrees.filter(
    (x) => !fl || `${x.nom} ${x.detail} ${x.code}`.toLowerCase().includes(fl),
  );

  const signaler = useCallback(
    (v: Verdict) => {
      setVerdict(v);
      if (v.etat === "ok") router.refresh();
      if (typeof navigator !== "undefined" && "vibrate" in navigator)
        navigator.vibrate?.(v.etat === "ok" ? 80 : [60, 60, 60]);
    },
    [router],
  );

  /** Vérification par le serveur, une lecture à la fois ; le même code est ignoré 4 secondes. */
  const traiter = useCallback(
    async (brut: string) => {
      const code = normalise(brut);
      if (!code || enCours.current) return;
      const now = Date.now();
      if (code === dernier.current.code && now - dernier.current.t < 4000)
        return;
      dernier.current = { code, t: now };
      enCours.current = true;
      try {
        const { error, verdict: v } = await scannerBillet(code);
        if (error || !v) return toast(error ?? "Vérification impossible.");
        signaler({ ...v, t: Date.now() });
      } catch {
        toast("Connexion au serveur impossible : réessayez.");
      } finally {
        enCours.current = false;
      }
    },
    [signaler],
  );

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
      setErreur(
        "La caméra n’est pas disponible sur cet appareil. Saisissez l’identifiant du billet.",
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      flux.current = stream;
      const v = video.current;
      if (!v) return;
      v.srcObject = stream;
      await v.play();
      setActif(true);
      const w = window as FenetreDetecteur;
      const detecteur = w.BarcodeDetector
        ? new w.BarcodeDetector({ formats: ["qr_code"] })
        : null;
      setMoteur(detecteur ? "natif" : "jsqr");
      const tick = async () => {
        if (!flux.current || !video.current || video.current.readyState < 2) {
          boucle.current = window.setTimeout(tick, 200);
          return;
        }
        try {
          if (detecteur) {
            const codes = await detecteur.detect(video.current);
            if (codes[0]?.rawValue) void traiter(codes[0].rawValue);
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
                ctx.drawImage(
                  video.current,
                  (vw - taille) / 2,
                  (vh - taille) / 2,
                  taille,
                  taille,
                  0,
                  0,
                  taille,
                  taille,
                );
                const img = ctx.getImageData(0, 0, taille, taille);
                const r = jsQR(img.data, img.width, img.height, {
                  inversionAttempts: "dontInvert",
                });
                if (r?.data) void traiter(r.data);
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
      setErreur(
        nom === "NotAllowedError"
          ? "Accès à la caméra refusé. Autorisez la caméra dans le navigateur ou saisissez l’identifiant."
          : "Impossible d’ouvrir la caméra. Saisissez l’identifiant du billet.",
      );
      arreter();
    }
  }

  useEffect(() => () => arreter(), [arreter]);

  useEffect(() => {
    if (!verdict) return;
    const id = window.setTimeout(() => setMasque(verdict.t), 5000);
    return () => window.clearTimeout(id);
  }, [verdict]);

  useEffect(() => {
    if (!actif) return;
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") arreter();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = avant;
      window.removeEventListener("keydown", onKey);
    };
  }, [actif, arreter]);

  const verdictVisible = verdict && masque !== verdict.t ? verdict : null;

  function valider(e: FormEvent) {
    e.preventDefault();
    if (!saisie.trim()) return;
    dernier.current = { code: "", t: 0 };
    void traiter(saisie);
    setSaisie("");
  }

  async function encaisser(v: Verdict) {
    if (!v.userId) return;
    setEncaissement(true);
    const { error, verdict: nv } = await encaisserEtValider(v.userId);
    setEncaissement(false);
    if (error || !nv) return toast(error ?? "Validation impossible.");
    signaler({ ...nv, t: Date.now() });
    toast(`Billet de ${nv.nom} réglé : entrée validée.`);
  }

  async function reinitialiser() {
    const { error } = await effacerEntrees();
    setEffacer(false);
    if (error) return toast(error);
    setVerdict(null);
    toast("Toutes les entrées ont été effacées.");
    router.refresh();
  }

  return (
    <>
      <div className={styles.tete}>
        <PageHead
          title="Scanner"
          accent="QR"
          text="À l’entrée du gala : visez le QR code du billet, la vérification est immédiate. Sans caméra, saisissez l’identifiant du billet."
          photo="accueil"
        >
          <Puce tone="white">
            {entres} / {inscrits} entrés
          </Puce>
        </PageHead>
      </div>

      <div className={styles.grille}>
        <div className={styles.colG}>
          <div
            className={`${ui.card} m-bleed ${styles.camera} ${actif ? styles.plein : ""}`}
            role={actif ? "dialog" : undefined}
            aria-modal={actif ? true : undefined}
            aria-label={actif ? "Scanner QR" : undefined}
          >
            <div
              className={`${styles.cadre} ${actif ? styles.cadreActif : ""} ${verdictVisible ? styles[`cadre_${verdictVisible.etat}`] : ""}`}
            >
              <video
                ref={video}
                className={styles.video}
                playsInline
                muted
                aria-label="Aperçu de la caméra"
              />
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
              ) : (
                <>
                  <div className={styles.pleinHaut}>
                    <button
                      type="button"
                      onClick={arreter}
                      className={styles.pleinFermer}
                      aria-label="Fermer le scanner"
                    >
                      <XIcon width={20} height={20} />
                    </button>
                    <div className={styles.pleinTitre}>
                      <strong>Scanner QR</strong>
                      <span>
                        <i />
                        Lecture en cours
                      </span>
                    </div>
                    <span className={styles.pleinCompte}>
                      <b>{entres}</b> / {inscrits}
                    </span>
                  </div>
                  <div className={styles.pleinBas} aria-live="polite">
                    {verdictVisible ? (
                      <div
                        key={verdictVisible.t}
                        className={`${styles.pleinVerdict} ${styles[`verdict_${verdictVisible.etat}`]}`}
                      >
                        <span className={styles.pleinIco}>
                          {verdictVisible.etat === "ok" ? (
                            <CheckIcon width={24} height={24} strokeWidth={2.6} />
                          ) : verdictVisible.etat === "inconnu" ? (
                            <XIcon width={24} height={24} strokeWidth={2.6} />
                          ) : (
                            <TicketIcon width={22} height={22} />
                          )}
                        </span>
                        <div className="min-w-0">
                          <strong>{TITRES[verdictVisible.etat]}</strong>
                          <p>
                            {verdictVisible.nom ?? verdictVisible.code}
                            {verdictVisible.etat === "deja" &&
                            verdictVisible.quand
                              ? ` · entré à ${heure(verdictVisible.quand)}`
                              : ""}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className={styles.pleinAide}>
                        Placez le QR code du billet dans le cadre
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className={styles.barre}>
              {actif ? (
                <>
                  <span className={styles.etatCam}>
                    <i />
                    Lecture en cours
                    {moteur === "jsqr" ? " · décodage logiciel" : ""}
                  </span>
                  <Btn small onClick={arreter}>
                    Arrêter
                  </Btn>
                </>
              ) : (
                <span className={styles.etatCamOff}>
                  Pointez le QR code au centre du cadre, à 15 ou 20 cm.
                </span>
              )}
            </div>
            {erreur ? <p className={styles.erreur}>{erreur}</p> : null}
          </div>
          <form
            onSubmit={valider}
            className={`${ui.card} ${ui.pad} m-bleed ${styles.manuel}`}
          >
            <Sur className="!mb-0">Saisie manuelle</Sur>
            <label htmlFor="sc-code" className="sr-only">
              Identifiant du billet
            </label>
            <div className={styles.ligneSaisie}>
              <div className="relative min-w-0 flex-1">
                <TicketIcon
                  width={17}
                  height={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graphite-faint"
                />
                <input
                  id="sc-code"
                  className={`${ui.saisie} !pl-10 uppercase`}
                  placeholder="TRV26-XXXXXXXX"
                  autoComplete="off"
                  autoCapitalize="characters"
                  value={saisie}
                  onChange={(e) => setSaisie(e.target.value)}
                />
              </div>
              <Btn variant="navy" type="submit">
                Vérifier
              </Btn>
            </div>
          </form>
        </div>
        <div className={styles.colD}>
          {verdict ? (
            <div
              key={verdict.t}
              className={`${styles.verdict} ${styles[`verdict_${verdict.etat}`]}`}
              role="status"
              aria-live="polite"
            >
              <span className={styles.verdictIco}>
                {verdict.etat === "ok" ? (
                  <CheckIcon width={30} height={30} strokeWidth={2.5} />
                ) : verdict.etat === "inconnu" ? (
                  <XIcon width={30} height={30} strokeWidth={2.5} />
                ) : (
                  <TicketIcon width={28} height={28} />
                )}
              </span>
              <div className={styles.verdictTexte}>
                <small>{heure(verdict.t)}</small>
                <strong>{TITRES[verdict.etat]}</strong>
                {verdict.nom ? (
                  <p className={styles.verdictNom}>
                    {verdict.nom}
                    {verdict.role || verdict.ent ? (
                      <span>
                        {" "}
                        ·{" "}
                        {[verdict.role, verdict.ent].filter(Boolean).join(", ")}
                      </span>
                    ) : null}
                  </p>
                ) : null}
                <p className={styles.verdictCode}>
                  {verdict.code}
                  {verdict.etat === "deja" && verdict.quand
                    ? ` · entré à ${heure(verdict.quand)}`
                    : ""}
                </p>
                <p>{CONSEILS[verdict.etat]}</p>
                {verdict.etat === "attente" && verdict.userId ? (
                  <div className="mt-2">
                    <Btn
                      small
                      variant="primary"
                      disabled={encaissement}
                      onClick={() => void encaisser(verdict)}
                    >
                      {encaissement
                        ? "Validation…"
                        : "Paiement reçu : valider l’entrée"}
                    </Btn>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
          <Card bleed className={styles.histo}>
            <div className={styles.histoTete}>
              <div className="min-w-0">
                <Sur className="!mb-0">Participants scannés</Sur>
                <p className={styles.compte}>
                  <b>{entres}</b> / {inscrits} entrés
                </p>
              </div>
              {entres ? (
                <Btn
                  small
                  className="!text-[#b42318]"
                  onClick={() => setEffacer(true)}
                >
                  Effacer
                </Btn>
              ) : null}
            </div>
            <div className={styles.jauge} aria-hidden>
              <i
                style={{
                  width: `${Math.min(100, Math.round((entres / total) * 100))}%`,
                }}
              />
            </div>
            {entres > 3 ? (
              <div className={styles.filtre}>
                <Recherche
                  value={filtre}
                  onChange={setFiltre}
                  placeholder="Rechercher un participant scanné…"
                  label="Rechercher un participant scanné"
                />
              </div>
            ) : null}
            {scannes.length ? (
              <ul className={styles.liste}>
                {scannes.map((x, i) => (
                  <li
                    key={x.userId}
                    className={
                      verdict?.etat === "ok" && verdict.code === x.code
                        ? styles.nouveau
                        : ""
                    }
                    style={{ "--i": Math.min(i, 8) } as React.CSSProperties}
                  >
                    <span className={styles.av}>
                      <AvatarInitiales
                        nom={x.nom}
                        photo={x.photo ?? undefined}
                        size={42}
                      />
                      <i>
                        <CheckIcon width={11} height={11} strokeWidth={3.5} />
                      </i>
                    </span>
                    <div className="min-w-0 flex-1">
                      <strong>{x.nom}</strong>
                      {x.detail ? <small>{x.detail}</small> : null}
                      <em>{x.code}</em>
                    </div>
                    <time>{heure(x.t)}</time>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.vide}>
                <QrIcon width={22} height={22} />
                <p>
                  {entres
                    ? "Aucun participant scanné ne correspond."
                    : "Aucun participant scanné pour l’instant. Chaque billet validé s’ajoute ici."}
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
      {effacer ? (
        <Confirmer
          titre="Effacer toutes les entrées ?"
          action="Effacer les entrées"
          onConfirmer={() => void reinitialiser()}
          onClose={() => setEffacer(false)}
        >
          Les {entres} entrées enregistrées seront supprimées et les billets
          pourront être scannés de nouveau. À utiliser après une répétition,
          pas pendant le gala.
        </Confirmer>
      ) : null}
    </>
  );
}
