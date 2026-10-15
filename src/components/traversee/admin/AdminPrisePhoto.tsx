"use client";

import { useEffect, useRef, useState } from "react";
import { CameraIcon, CheckIcon, ImageIcon, RefreshIcon, SpinnerIcon, XIcon } from "@/components/app/icons";
import { setTraversee, toast, uid } from "@/lib/traversee/store";
import styles from "./prisePhoto.module.css";

type Envoi = { id: string; apercu: string; etat: "envoi" | "ok" | "echec" };

const COTE_MAX = 1920;

function versBlob(source: CanvasImageSource, largeur: number, hauteur: number): Promise<Blob | null> {
  const echelle = Math.min(1, COTE_MAX / Math.max(largeur, hauteur));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(largeur * echelle);
  canvas.height = Math.round(hauteur * echelle);
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
}

function fichierVersBlob(fichier: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(fichier);
    const img = new Image();
    img.onload = () => {
      void versBlob(img, img.naturalWidth, img.naturalHeight).then((b) => {
        URL.revokeObjectURL(url);
        resolve(b);
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

export function AdminPrisePhoto({ total }: { total: number }) {
  const video = useRef<HTMLVideoElement | null>(null);
  const appareil = useRef<HTMLInputElement | null>(null);
  const apercus = useRef(new Set<string>());
  const [flux, setFlux] = useState<MediaStream | null>(null);
  const [face, setFace] = useState<"environment" | "user">("environment");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envois, setEnvois] = useState<Envoi[]>([]);
  const [flash, setFlash] = useState(0);
  const prises = envois.filter((e) => e.etat === "ok").length;

  useEffect(() => {
    const v = video.current;
    if (!v || !flux) return;
    v.srcObject = flux;
    v.play().catch(() => undefined);
    const scroll = document.body.style.overflow;
    if (window.matchMedia("(max-width: 1023px)").matches) document.body.style.overflow = "hidden";
    return () => {
      flux.getTracks().forEach((t) => t.stop());
      document.body.style.overflow = scroll;
    };
  }, [flux]);

  useEffect(() => {
    const urls = apercus.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  async function demarrer(f: "environment" | "user" = face) {
    setErreur(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      appareil.current?.click();
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: f }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      setFlux(s);
    } catch {
      setErreur("Caméra inaccessible : autorisez l’accès à la caméra dans le navigateur, ou importez des photos.");
    }
  }

  function arreter() {
    flux?.getTracks().forEach((t) => t.stop());
    setFlux(null);
  }

  function retourner() {
    const suivante = face === "environment" ? "user" : "environment";
    arreter();
    setFace(suivante);
    void demarrer(suivante);
  }

  async function envoyer(blob: Blob) {
    const id = uid("e");
    const apercu = URL.createObjectURL(blob);
    apercus.current.add(apercu);
    setEnvois((e) => [{ id, apercu, etat: "envoi" as const }, ...e].slice(0, 12));
    try {
      const r = await fetch("/api/photos", { method: "POST", headers: { "Content-Type": blob.type || "image/jpeg" }, body: blob });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean; id?: string; url?: string; message?: string };
      if (!r.ok || !d.ok || !d.url || !d.id) throw new Error(d.message ?? "La photo n’a pas pu être enregistrée.");
      const url = d.url;
      const idPhoto = d.id;
      setTraversee((st) => ({ galAjoutees: [{ id: `ph-${idPhoto}`, src: url, par: "CanCham" as const, t: Date.now() }, ...st.galAjoutees] }));
      setEnvois((e) => e.map((x) => (x.id === id ? { ...x, etat: "ok" } : x)));
    } catch (err) {
      setEnvois((e) => e.map((x) => (x.id === id ? { ...x, etat: "echec" } : x)));
      toast(err instanceof Error ? err.message : "La photo n’a pas pu être enregistrée.");
    }
  }

  async function declencher() {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    setFlash((n) => n + 1);
    const blob = await versBlob(v, v.videoWidth, v.videoHeight);
    if (blob) void envoyer(blob);
  }

  async function importer(fichiers: FileList | null) {
    const liste = Array.from(fichiers ?? []).filter((f) => f.type.startsWith("image/"));
    for (const f of liste) {
      const blob = await fichierVersBlob(f);
      if (blob) void envoyer(blob);
      else toast(`« ${f.name} » n’a pas pu être lue.`);
    }
  }

  useEffect(() => {
    if (!flux) return;
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") arreter();
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        void declencher();
      }
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  });

  const pellicule = envois.length ? (
    <div className={styles.pellicule} aria-label="Dernières photos prises">
      {envois.map((e) => (
        <span key={e.id} className={`${styles.miniature} ${styles[e.etat]}`}>
          <img src={e.apercu} alt="" />
          <i aria-label={e.etat === "envoi" ? "Envoi en cours" : e.etat === "ok" ? "Ajoutée à la galerie" : "Échec de l’envoi"}>
            {e.etat === "envoi" ? <SpinnerIcon width={14} height={14} className="animate-spin" /> : e.etat === "ok" ? <CheckIcon width={14} height={14} /> : <XIcon width={14} height={14} />}
          </i>
        </span>
      ))}
    </div>
  ) : null;

  return (
    <section className={styles.prise} aria-labelledby="prise-titre">
      <div className={styles.entete}>
        <div className="min-w-0">
          <p className={styles.surtitre}>Photos et vidéos</p>
          <h1 id="prise-titre">Prendre une photo</h1>
          <p className={styles.chapo}>Chaque photo prise est ajoutée automatiquement à la galerie ci-dessous et aux stories des participants.</p>
        </div>
        <div className={styles.chiffres}>
          <div>
            <b>{total}</b>
            <small>en ligne</small>
          </div>
          <div>
            <b>{prises}</b>
            <small>prises ici</small>
          </div>
        </div>
      </div>

      {flux ? (
        <div className={styles.viseur}>
          <video ref={video} playsInline muted autoPlay className={face === "user" ? styles.miroir : ""} />
          {flash ? <i key={flash} className={styles.flash} aria-hidden /> : null}
          <button type="button" className={styles.fermer} onClick={arreter} aria-label="Fermer la caméra">
            <XIcon width={22} height={22} />
          </button>
          <div className={styles.commandes}>
            <span className={styles.derniere}>{envois[0] ? <img src={envois[0].apercu} alt="Dernière photo" /> : null}</span>
            <button type="button" className={styles.declencheur} onClick={() => void declencher()} aria-label="Prendre la photo">
              <span />
            </button>
            <button type="button" className={styles.retourner} onClick={retourner} aria-label="Changer de caméra">
              <RefreshIcon width={22} height={22} />
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.boutons}>
          <button type="button" className={styles.ouvrir} onClick={() => void demarrer()}>
            <CameraIcon width={20} height={20} />
            Prendre une photo
          </button>
          <label className={styles.importer}>
            <ImageIcon width={18} height={18} />
            Importer des photos
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                void importer(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          <input
            ref={appareil}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => {
              void importer(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {erreur ? (
        <p className={styles.alerte} role="alert">
          {erreur}
        </p>
      ) : null}
      {pellicule}
    </section>
  );
}
