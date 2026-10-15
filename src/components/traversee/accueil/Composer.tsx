"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Avatar } from "@/components/app/Avatar";
import { ImageIcon, SmileIcon, VideoIcon, XIcon } from "@/components/app/icons";
import { useProfile } from "@/components/profile/useProfile";
import { heureNow } from "@/lib/traversee/data";
import { journaliser, lisImage, setTraversee, toast, uid } from "@/lib/traversee/store";
import { fullName } from "@/lib/mock/data";
import { Modal } from "../Modal";
import { AvatarSigle, Btn, Card, Onglets } from "../ui";
import styles from "./accueil.module.css";

const EMOJIS = ["😀", "😂", "🥂", "🎉", "👏", "🔥", "❤️", "🙌", "🤝", "🌍", "💼", "✈️"];

type Mode = "publication" | "story";

const VIDEO_MAX = 100 * 1024 * 1024;

export function Composer({ admin = false, modeInitial = null, onModeConsomme }: { admin?: boolean; modeInitial?: Mode | null; onModeConsomme?: () => void }) {
  const me = useProfile();
  const [ouvert, setOuvert] = useState(false);
  const [mode, setMode] = useState<Mode>("publication");
  const [texte, setTexte] = useState("");
  const [img, setImg] = useState<string | null>(null);
  const [video, setVideo] = useState<{ file: File; apercu: string } | null>(null);
  const [envoi, setEnvoi] = useState<number | null>(null);
  const [emojis, setEmojis] = useState(false);
  const zone = useRef<HTMLTextAreaElement | null>(null);
  const fichier = useRef<HTMLInputElement | null>(null);
  const fichierVideo = useRef<HTMLInputElement | null>(null);
  const story = admin && mode === "story";

  useEffect(() => {
    if (ouvert) window.setTimeout(() => zone.current?.focus(), 50);
  }, [ouvert]);

  useEffect(() => {
    if (!modeInitial) return;
    const id = window.setTimeout(() => {
      setMode(modeInitial);
      setOuvert(true);
      onModeConsomme?.();
    }, 0);
    return () => window.clearTimeout(id);
  }, [modeInitial, onModeConsomme]);

  function fermer() {
    setOuvert(false);
    setEmojis(false);
  }

  function ouvrir(m: Mode = "publication") {
    setMode(m);
    setOuvert(true);
  }

  function ouvrirAvecPhoto() {
    ouvrir();
    window.setTimeout(() => fichier.current?.click(), 80);
  }

  function ouvrirAvecVideo() {
    ouvrir();
    window.setTimeout(() => fichierVideo.current?.click(), 80);
  }

  function retirerVideo() {
    if (video) URL.revokeObjectURL(video.apercu);
    setVideo(null);
  }

  function choisirVideo(f: File | undefined) {
    if (fichierVideo.current) fichierVideo.current.value = "";
    if (!f) return;
    if (!/^video\/(mp4|quicktime|webm)$/.test(f.type)) return toast("Choisissez une vidéo MP4, MOV ou WebM.");
    if (f.size > VIDEO_MAX) return toast("Vidéo trop lourde : 100 Mo maximum.");
    retirerVideo();
    setImg(null);
    setVideo({ file: f, apercu: URL.createObjectURL(f) });
  }

  function envoyerVideo(f: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/videos");
      xhr.setRequestHeader("Content-Type", f.type || "application/octet-stream");
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) setEnvoi(Math.round((ev.loaded / ev.total) * 100));
      };
      xhr.onload = () => {
        let corps: { ok?: boolean; url?: string; message?: string } = {};
        try {
          corps = JSON.parse(xhr.responseText);
        } catch {
          corps = {};
        }
        if (xhr.status >= 200 && xhr.status < 300 && corps.url) resolve(corps.url);
        else reject(new Error(corps.message ?? "La vidéo n’a pas pu être envoyée."));
      };
      xhr.onerror = () => reject(new Error("Connexion interrompue pendant l’envoi de la vidéo."));
      xhr.send(f);
    });
  }

  async function publier(e: FormEvent) {
    e.preventDefault();
    if (envoi !== null) return;
    const tx = texte.trim();
    if (story) {
      if (!img) return toast("Choisissez la photo de la story.");
      setTraversee((s) => ({ stories: [{ id: uid("s"), img, texte: "" }, ...s.stories] }));
      if (admin) journaliser({ pour: "participant", type: "story", titre: "CanCham Madagascar a ajouté une story", texte: "Ouvrez l’accueil pour la découvrir avant qu’elle ne disparaisse.", href: "/" });
      else journaliser({ pour: "admin", type: "story", titre: `${fullName(me)} a partagé une story`, texte: "Visible par tous les participants en haut de l’accueil.", href: "/admin", acteur: fullName(me) });
      toast("Story publiée : elle apparaît en haut de l’accueil des participants.");
    } else if (admin) {
      if (!tx && !img) return toast("Écrivez un texte ou ajoutez une photo.");
      setTraversee((s) => ({ pubs: [{ id: uid("c"), texte: tx, img: img ?? undefined, date: `Publié aujourd’hui à ${heureNow().replace(":", " h ")}` }, ...s.pubs] }));
      journaliser({ pour: "participant", type: "publication", titre: "CanCham Madagascar a publié une actualité", texte: tx || "Nouvelle photo dans le fil d’actualités.", href: "/" });
      toast("Publication en ligne sur l’accueil des participants.");
    } else {
      if (!tx && !img && !video) return toast("Écrivez un texte ou ajoutez une photo ou une vidéo.");
      let url: string | undefined;
      if (video) {
        setEnvoi(0);
        try {
          url = await envoyerVideo(video.file);
        } catch (err) {
          setEnvoi(null);
          return toast(err instanceof Error ? err.message : "La vidéo n’a pas pu être envoyée.");
        }
        setEnvoi(null);
        retirerVideo();
      }
      setTraversee((s) => ({ posts: [{ id: uid("p"), texte: tx, img: img ?? undefined, video: url, t: Date.now() }, ...s.posts] }));
      journaliser({ pour: "admin", type: "publication", titre: `${fullName(me)} a publié dans le fil`, texte: tx || (url ? "Nouvelle vidéo partagée." : "Nouvelle photo partagée."), href: "/admin", acteur: fullName(me) });
      toast("Publication partagée avec les participants.");
    }
    setTexte("");
    setImg(null);
    fermer();
  }

  async function choisir(f: File | undefined) {
    const u = await lisImage(f, 1080);
    if (u) {
      retirerVideo();
      setImg(u);
    }
  }

  const prenom = admin ? "CanCham" : me.firstName;
  const nom = admin ? "CanCham Madagascar" : fullName(me);

  return (
    <>
      <Card bleed className={styles.composer}>
        <span className={styles.anneau}>{admin ? <AvatarSigle size={40} /> : <Avatar person={me} size={40} />}</span>
        <button type="button" className={styles.quoi} onClick={() => ouvrir()}>
          {admin ? "Publier au nom de la CanCham…" : `Quoi de neuf, ${prenom} ?`}
        </button>
        <div className={styles.outilsC}>
          {admin ? (
            <button type="button" className={`${styles.outilC} ${styles.outilVideo}`} onClick={() => ouvrir("story")} aria-label="Créer une story">
              <VideoIcon width={20} height={20} />
              <span>Story</span>
            </button>
          ) : (
            <button type="button" className={`${styles.outilC} ${styles.outilVideo}`} onClick={ouvrirAvecVideo} aria-label="Vidéo">
              <VideoIcon width={20} height={20} />
              <span>Vidéo</span>
            </button>
          )}
          <button type="button" className={`${styles.outilC} ${styles.outilPhoto}`} onClick={ouvrirAvecPhoto} aria-label="Photo">
            <ImageIcon width={20} height={20} />
            <span>Photo</span>
          </button>
          <button
            type="button"
            className={`${styles.outilC} ${styles.outilEmoji}`}
            onClick={() => {
              ouvrir();
              setEmojis(true);
            }}
            aria-label="Humeur"
          >
            <SmileIcon width={20} height={20} />
            <span>Humeur</span>
          </button>
        </div>
      </Card>

      {ouvert ? (
        <Modal onClose={fermer} label={story ? "Créer une story" : "Créer une publication"} size="large">
          <form onSubmit={publier} className="grid gap-3.5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-[18px] text-graphite">{story ? "Créer une story" : "Créer une publication"}</h3>
              <button type="button" onClick={fermer} aria-label="Fermer" className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-graphite-muted hover:bg-paper">
                <XIcon width={18} height={18} />
              </button>
            </div>
            {admin ? (
              <Onglets
                items={[
                  { v: "publication", label: "Publication" },
                  { v: "story", label: "Story" },
                ]}
                value={mode}
                onChange={(v) => {
                  setMode(v);
                }}
                label="Type de contenu"
              />
            ) : null}
            <div className="flex items-center gap-3">
              {admin ? <AvatarSigle size={44} /> : <Avatar person={me} size={44} />}
              <div>
                <strong className="block text-graphite">{nom}</strong>
                <small className="text-graphite-muted">{story ? "Photo seule, affichée en plein écran en haut de l’accueil des participants" : "Visible par tous les participants"}</small>
              </div>
            </div>
            {story ? null : <textarea ref={zone} value={texte} onChange={(e) => setTexte(e.target.value)} className={styles.zoneTexte} placeholder={admin ? "Publiez au nom de la CanCham…" : `Quoi de neuf, ${prenom} ?`} aria-label="Votre publication" maxLength={1200} />}
            {img ? (
              <div className="relative">
                <img className={styles.une} src={img} alt="Photo jointe" style={story ? { aspectRatio: "9 / 12", maxWidth: 220, justifySelf: "center", marginInline: "auto" } : undefined} />
                <button type="button" onClick={() => setImg(null)} aria-label="Retirer la photo" className="absolute right-2 top-2 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-white/90 text-graphite shadow">
                  <XIcon width={16} height={16} />
                </button>
              </div>
            ) : null}
            {video ? (
              <div className="relative">
                <video className={styles.une} src={video.apercu} controls playsInline preload="metadata" />
                <button type="button" onClick={retirerVideo} disabled={envoi !== null} aria-label="Retirer la vidéo" className="absolute right-2 top-2 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-white/90 text-graphite shadow">
                  <XIcon width={16} height={16} />
                </button>
                <small className="mt-1.5 block text-graphite-muted">
                  {video.file.name} · {(video.file.size / 1024 / 1024).toFixed(1).replace(".", ",")} Mo
                </small>
              </div>
            ) : null}
            {emojis && !story ? (
              <div className={styles.emojis}>
                {EMOJIS.map((e) => (
                  <button key={e} type="button" onClick={() => setTexte((t) => `${t}${e}`)} aria-label={`Ajouter ${e}`}>
                    {e}
                  </button>
                ))}
              </div>
            ) : null}
            <div className={styles.ajout}>
              <span>{story ? "Photo de la story (obligatoire)" : "Ajouter à votre publication"}</span>
              <div className="flex gap-1">
                <button type="button" className={`${styles.outilC} ${styles.outilPhoto}`} onClick={() => fichier.current?.click()} aria-label="Joindre une photo">
                  <ImageIcon width={20} height={20} />
                </button>
                {admin ? null : (
                  <button type="button" className={`${styles.outilC} ${styles.outilVideo}`} onClick={() => fichierVideo.current?.click()} aria-label="Joindre une vidéo">
                    <VideoIcon width={20} height={20} />
                  </button>
                )}
                {story ? null : (
                  <button type="button" className={`${styles.outilC} ${styles.outilEmoji}`} onClick={() => setEmojis((v) => !v)} aria-label="Émojis" aria-pressed={emojis}>
                    <SmileIcon width={20} height={20} />
                  </button>
                )}
              </div>
            </div>
            <input ref={fichier} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => void choisir(e.target.files?.[0])} />
            <input ref={fichierVideo} type="file" accept="video/mp4,video/quicktime,video/webm" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => choisirVideo(e.target.files?.[0])} />
            <Btn variant="primary" type="submit" disabled={story ? !img : (!texte.trim() && !img && !video) || envoi !== null} className="w-full">
              {story ? "Publier la story" : envoi !== null ? `Envoi de la vidéo… ${envoi} %` : "Publier"}
            </Btn>
          </form>
        </Modal>
      ) : null}
    </>
  );
}
