"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { CameraIcon, FilmIcon, SpinnerIcon, TrashIcon, UploadIcon, XIcon } from "@/components/app/icons";
import type { Challenge } from "@/lib/mock/challenges";
import { saveParticipation, shrinkImage, videoDuration, type Participation } from "./useParticipation";
import styles from "./challenges.module.css";

type ParticipationSheetProps = {
  challenge: Challenge;
  existing?: Participation;
  onClose: () => void;
};

type Phase = "form" | "sending" | "done";

const SOCIAL = /^(https?:\/\/)?([a-z0-9-]+\.)*(facebook\.com|fb\.com|fb\.watch|instagram\.com)\//i;
const MAX_VIDEO_SECONDS = 120;

const field =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-[15px] text-graphite placeholder:text-graphite-faint " +
  "outline-none transition-[border-color,box-shadow] focus:border-palm focus:shadow-[0_0_0_4px_rgba(11,107,63,0.12)] aria-invalid:border-leaf";
const label = "mb-1.5 block text-[13px] font-semibold text-graphite";

function formatSeconds(s: number) {
  return `${Math.floor(s / 60)}:${Math.round(s % 60).toString().padStart(2, "0")}`;
}

const CONFETTI = [
  { dx: "-90px", dy: "-70px", rot: "200deg", c: "var(--leaf)" },
  { dx: "70px", dy: "-90px", rot: "-160deg", c: "var(--gold)" },
  { dx: "-50px", dy: "-110px", rot: "120deg", c: "var(--palm)" },
  { dx: "110px", dy: "-40px", rot: "260deg", c: "var(--leaf)" },
  { dx: "-120px", dy: "-20px", rot: "-90deg", c: "var(--gold)" },
  { dx: "40px", dy: "-120px", rot: "180deg", c: "var(--palm)" },
  { dx: "95px", dy: "-95px", rot: "80deg", c: "var(--gold)" },
  { dx: "-30px", dy: "-60px", rot: "-220deg", c: "var(--leaf)" },
];

export function ParticipationSheet({ challenge, existing, onClose }: ParticipationSheetProps) {
  const isVideo = challenge.kind === "video";
  const [phase, setPhase] = useState<Phase>("form");
  const [photo, setPhoto] = useState<string | undefined>(existing?.photo);
  const [videoUrl, setVideoUrl] = useState<string | undefined>(undefined);
  const [videoMeta, setVideoMeta] = useState(existing?.video);
  const [link, setLink] = useState(existing?.link ?? "");
  const [company, setCompany] = useState(existing?.company ?? "");
  const [pitch, setPitch] = useState(existing?.pitch ?? "");
  const [agree, setAgree] = useState(Boolean(existing));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const linkId = useId();
  const companyId = useId();
  const pitchId = useId();
  const agreeId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase !== "sending") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, phase]);

  useEffect(() => () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
  }, [videoUrl]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      if (isVideo) {
        if (!file.type.startsWith("video/")) throw new Error("Choisissez un fichier vidéo.");
        const seconds = await videoDuration(file);
        if (seconds > MAX_VIDEO_SECONDS) throw new Error(`La vidéo dure ${formatSeconds(seconds)} : la limite est de 2 minutes.`);
        if (videoUrl) URL.revokeObjectURL(videoUrl);
        setVideoUrl(URL.createObjectURL(file));
        setVideoMeta({ name: file.name, seconds: Math.round(seconds), sizeMb: Math.round((file.size / 1_048_576) * 10) / 10 });
      } else {
        if (!file.type.startsWith("image/")) throw new Error("Choisissez une image (JPG, PNG, HEIC…).");
        setPhoto(await shrinkImage(file));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fichier illisible.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function onInput(e: ChangeEvent<HTMLInputElement>) {
    void handleFile(e.target.files?.[0]);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDrag(false);
    void handleFile(e.dataTransfer.files?.[0]);
  }

  const hasMedia = isVideo ? Boolean(videoMeta) : Boolean(photo);
  const canSubmit = hasMedia && agree && (!isVideo || company.trim().length > 1) && !busy;

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmedLink = link.trim();
    if (!hasMedia) {
      setError(isVideo ? "Ajoutez votre vidéo de pitch." : "Ajoutez la photo de votre publication.");
      return;
    }
    if (trimmedLink && !SOCIAL.test(trimmedLink)) {
      setError("Le lien doit pointer vers une publication Facebook ou Instagram.");
      return;
    }
    if (!agree) {
      setError("Cochez la case pour confirmer les conditions.");
      return;
    }
    setError(null);
    setPhase("sending");
    window.setTimeout(() => {
      saveParticipation({
        slug: challenge.slug,
        submittedAt: new Date().toISOString(),
        status: "received",
        photo: isVideo ? undefined : photo,
        link: trimmedLink || undefined,
        video: isVideo ? videoMeta : undefined,
        company: isVideo ? company.trim() : undefined,
        pitch: isVideo ? pitch.trim() || undefined : undefined,
      });
      setPhase("done");
    }, 900);
  }

  return (
    <>
      <div className={styles.scrim} onClick={phase === "sending" ? undefined : onClose} aria-hidden />
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className={styles.handle} aria-hidden />

        {phase === "done" ? (
          <div className={styles.success}>
            <span className={styles.confetti} aria-hidden>
              {CONFETTI.map((c, i) => (
                <span key={i} style={{ "--dx": c.dx, "--dy": c.dy, "--rot": c.rot, "--c": c.c } as React.CSSProperties} />
              ))}
            </span>
            <span className={styles.checkRing}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path className={styles.checkPath} d="M4.5 12.5 9.5 17.5 19.5 7" />
              </svg>
            </span>
            <h2 id={titleId} className="font-display text-[1.7rem] leading-tight text-graphite">
              {isVideo ? "Candidature déposée !" : "Participation envoyée !"}
            </h2>
            <p className="max-w-sm text-[15px] leading-6 text-graphite-muted">
              {isVideo
                ? "Le jury étudie toutes les candidatures. Les dix finalistes seront dévoilés dans l'application le 18 décembre."
                : "Nous vérifions votre publication. Gardez-la publique jusqu'à l'annonce du gagnant, et faites réagir votre réseau !"}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-palm text-[15px] font-semibold text-white hover:bg-palm-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm focus-visible:ring-offset-2"
            >
              Retour au défi
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-5">
            <header className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-graphite-faint">Défi {challenge.number} · {challenge.phase}</p>
                <h2 id={titleId} className="mt-1 font-display text-[1.5rem] leading-tight text-graphite">
                  {existing ? "Modifier ma participation" : challenge.title}
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                disabled={phase === "sending"}
                aria-label="Fermer"
                className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full text-graphite-muted hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm"
              >
                <XIcon width={20} height={20} />
              </button>
            </header>

            <div>
              <span className={label}>{isVideo ? "Votre vidéo de pitch" : "La photo de votre publication"}</span>
              <input ref={fileRef} type="file" accept={isVideo ? "video/*" : "image/*"} capture={isVideo ? undefined : "environment"} onChange={onInput} className="sr-only" tabIndex={-1} aria-hidden />
              {hasMedia ? (
                <div className={styles.preview}>
                  {isVideo ? (
                    videoUrl ? (
                      <video src={videoUrl} controls playsInline muted />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-white/85">
                        <FilmIcon width={32} height={32} />
                        <span className="text-[13px]">{videoMeta?.name}</span>
                      </div>
                    )
                  ) : (
                    <img src={photo} alt="Aperçu de votre photo" />
                  )}
                  <div className="absolute right-2 top-2 flex gap-1.5">
                    <button type="button" onClick={() => fileRef.current?.click()} className="h-9 cursor-pointer rounded-full bg-white/90 px-3 text-[13px] font-semibold text-[#0f1d2c] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm">
                      Changer
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPhoto(undefined);
                        setVideoMeta(undefined);
                        if (videoUrl) URL.revokeObjectURL(videoUrl);
                        setVideoUrl(undefined);
                      }}
                      aria-label="Retirer le fichier"
                      className="grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-white/90 text-[#ad0707] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palm"
                    >
                      <TrashIcon width={17} height={17} />
                    </button>
                  </div>
                  {isVideo && videoMeta ? (
                    <p className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2.5 py-1 font-mono text-[11px] text-white">
                      {formatSeconds(videoMeta.seconds)} · {videoMeta.sizeMb} Mo
                    </p>
                  ) : null}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDrag(true);
                  }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={onDrop}
                  disabled={busy}
                  className={`${styles.dropzone} ${drag ? styles.dropzoneActive : ""}`}
                >
                  {busy ? (
                    <SpinnerIcon width={28} height={28} className={styles.spin} />
                  ) : isVideo ? (
                    <FilmIcon width={30} height={30} />
                  ) : (
                    <CameraIcon width={30} height={30} />
                  )}
                  <span className="text-[15px] font-semibold">{isVideo ? "Ajouter ma vidéo" : "Ajouter une photo"}</span>
                  <span className="flex items-center gap-1 text-[12.5px]">
                    <UploadIcon width={14} height={14} />
                    {isVideo ? "2 minutes maximum, filmée au téléphone si vous voulez" : "Depuis l'appareil photo ou la galerie"}
                  </span>
                </button>
              )}
            </div>

            {isVideo ? (
              <>
                <div>
                  <label htmlFor={companyId} className={label}>Nom de l’entreprise</label>
                  <input id={companyId} value={company} onChange={(e) => setCompany(e.target.value)} required autoComplete="organization" placeholder="Votre entreprise" className={field} />
                </div>
                <div>
                  <label htmlFor={pitchId} className={label}>
                    Votre pitch en une phrase <span className="font-normal text-graphite-faint">(facultatif)</span>
                  </label>
                  <input id={pitchId} value={pitch} onChange={(e) => setPitch(e.target.value)} maxLength={140} placeholder="Ce que vous faites, pour qui, et pourquoi le Canada" className={field} />
                </div>
              </>
            ) : (
              <div>
                <label htmlFor={linkId} className={label}>
                  Lien de votre publication <span className="font-normal text-graphite-faint">(facultatif)</span>
                </label>
                <input id={linkId} type="url" inputMode="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://www.facebook.com/…" className={field} />
                <p className="mt-1.5 text-[12.5px] leading-5 text-graphite-muted">Facebook ou Instagram. C’est ce lien que l’équipe utilise pour relever les réactions.</p>
              </div>
            )}

            <label htmlFor={agreeId} className="flex cursor-pointer items-start gap-3 rounded-xl bg-paper p-3 text-[13.5px] leading-5 text-graphite">
              <input id={agreeId} type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-palm" />
              <span>
                {isVideo
                  ? "J’accepte que ma vidéo soit diffusée dans l’application et pendant le gala."
                  : "Ma publication est publique et tague @CanCham Madagascar. Je la laisse en ligne jusqu’à l’annonce du gagnant."}
              </span>
            </label>

            {error ? (
              <p role="alert" className="rounded-lg border border-leaf/40 bg-leaf-soft px-3 py-2.5 text-[13px] leading-5 text-leaf-ink">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit || phase === "sending"}
              className={`flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-[15px] font-semibold text-white transition-[background-color,transform] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                isVideo ? "bg-leaf hover:bg-[#8f0606] focus-visible:ring-leaf" : "bg-palm hover:bg-palm-deep focus-visible:ring-palm"
              }`}
            >
              {phase === "sending" ? (
                <>
                  <SpinnerIcon width={18} height={18} className={styles.spin} />
                  Envoi…
                </>
              ) : existing ? (
                "Enregistrer les modifications"
              ) : isVideo ? (
                "Déposer ma candidature"
              ) : (
                "Envoyer ma participation"
              )}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
