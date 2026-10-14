"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Avatar } from "@/components/app/Avatar";
import { ImageIcon, SmileIcon, VideoIcon, XIcon } from "@/components/app/icons";
import { useProfile } from "@/components/profile/useProfile";
import { heureNow } from "@/lib/traversee/data";
import { lisImage, setTraversee, toast, uid } from "@/lib/traversee/store";
import { fullName } from "@/lib/mock/data";
import { Modal } from "../Modal";
import { AvatarSigle, Btn, Card, Onglets } from "../ui";
import styles from "./accueil.module.css";

const EMOJIS = ["😀", "😂", "🥂", "🎉", "👏", "🔥", "❤️", "🙌", "🤝", "🌍", "💼", "✈️"];

type Mode = "publication" | "story";

export function Composer({ admin = false, modeInitial = null, onModeConsomme }: { admin?: boolean; modeInitial?: Mode | null; onModeConsomme?: () => void }) {
  const me = useProfile();
  const [ouvert, setOuvert] = useState(false);
  const [mode, setMode] = useState<Mode>("publication");
  const [texte, setTexte] = useState("");
  const [img, setImg] = useState<string | null>(null);
  const [emojis, setEmojis] = useState(false);
  const zone = useRef<HTMLTextAreaElement | null>(null);
  const fichier = useRef<HTMLInputElement | null>(null);
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

  function publier(e: FormEvent) {
    e.preventDefault();
    const tx = texte.trim();
    if (story) {
      if (!img) return toast("Choisissez la photo de la story.");
      setTraversee((s) => ({ stories: [{ id: uid("s"), img, texte: tx }, ...s.stories] }));
      toast("Story publiée : elle apparaît en haut de l’accueil des participants.");
    } else if (admin) {
      if (!tx && !img) return toast("Écrivez un texte ou ajoutez une photo.");
      setTraversee((s) => ({ pubs: [{ id: uid("c"), texte: tx, img: img ?? undefined, date: `Publié aujourd’hui à ${heureNow().replace(":", " h ")}` }, ...s.pubs] }));
      toast("Publication en ligne sur l’accueil des participants.");
    } else {
      if (!tx && !img) return toast("Écrivez un texte ou ajoutez une photo.");
      setTraversee((s) => ({ posts: [{ id: uid("p"), texte: tx, img: img ?? undefined, t: Date.now() }, ...s.posts] }));
      toast("Publication partagée avec les participants.");
    }
    setTexte("");
    setImg(null);
    fermer();
  }

  async function choisir(f: File | undefined) {
    const u = await lisImage(f, 1080);
    if (u) setImg(u);
  }

  const prenom = admin ? "CanCham" : me.firstName;
  const nom = admin ? "CanCham Madagascar" : fullName(me);

  return (
    <>
      <Card bleed className={styles.composer}>
        {admin ? <AvatarSigle size={40} /> : <Avatar person={me} size={40} />}
        <button type="button" className={styles.quoi} onClick={() => ouvrir()}>
          {admin ? "Publier au nom de la CanCham…" : `Quoi de neuf, ${prenom} ?`}
        </button>
        <div className={styles.outilsC}>
          {admin ? (
            <button type="button" className={`${styles.outilC} ${styles.outilVideo}`} onClick={() => ouvrir("story")} aria-label="Créer une story">
              <VideoIcon width={20} height={20} />
            </button>
          ) : (
            <button type="button" className={`${styles.outilC} ${styles.outilVideo}`} onClick={() => toast("Les vidéos arrivent dans la prochaine version.")} aria-label="Vidéo">
              <VideoIcon width={20} height={20} />
            </button>
          )}
          <button type="button" className={`${styles.outilC} ${styles.outilPhoto}`} onClick={ouvrirAvecPhoto} aria-label="Photo">
            <ImageIcon width={20} height={20} />
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
                  setTexte((t) => t.slice(0, v === "story" ? 120 : 1200));
                }}
                label="Type de contenu"
              />
            ) : null}
            <div className="flex items-center gap-3">
              {admin ? <AvatarSigle size={44} /> : <Avatar person={me} size={44} />}
              <div>
                <strong className="block text-graphite">{nom}</strong>
                <small className="text-graphite-muted">{story ? "Affichée en plein écran en haut de l’accueil des participants" : "Visible par tous les participants"}</small>
              </div>
            </div>
            <textarea ref={zone} value={texte} onChange={(e) => setTexte(e.target.value)} className={styles.zoneTexte} placeholder={story ? "Texte court affiché sur la story…" : admin ? "Publiez au nom de la CanCham…" : `Quoi de neuf, ${prenom} ?`} aria-label={story ? "Texte de la story" : "Votre publication"} maxLength={story ? 120 : 1200} />
            {img ? (
              <div className="relative">
                <img className={styles.une} src={img} alt="Photo jointe" style={story ? { aspectRatio: "9 / 12", maxWidth: 220, justifySelf: "center", marginInline: "auto" } : undefined} />
                <button type="button" onClick={() => setImg(null)} aria-label="Retirer la photo" className="absolute right-2 top-2 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-white/90 text-graphite shadow">
                  <XIcon width={16} height={16} />
                </button>
              </div>
            ) : null}
            {emojis ? (
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
                <button type="button" className={`${styles.outilC} ${styles.outilEmoji}`} onClick={() => setEmojis((v) => !v)} aria-label="Émojis" aria-pressed={emojis}>
                  <SmileIcon width={20} height={20} />
                </button>
              </div>
            </div>
            <input ref={fichier} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => void choisir(e.target.files?.[0])} />
            <Btn variant="primary" type="submit" disabled={story ? !img : !texte.trim() && !img} className="w-full">
              {story ? "Publier la story" : "Publier"}
            </Btn>
          </form>
        </Modal>
      ) : null}
    </>
  );
}
