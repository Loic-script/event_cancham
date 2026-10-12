"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Avatar } from "@/components/app/Avatar";
import { ImageIcon, SmileIcon, VideoIcon, XIcon } from "@/components/app/icons";
import { useProfile } from "@/components/profile/useProfile";
import { lisImage, setTraversee, toast, uid } from "@/lib/traversee/store";
import { fullName } from "@/lib/mock/data";
import { Modal } from "../Modal";
import { Btn, Card } from "../ui";
import styles from "./accueil.module.css";

const EMOJIS = ["😀", "😂", "🥂", "🎉", "👏", "🔥", "❤️", "🙌", "🤝", "🌍", "💼", "✈️"];

export function Composer() {
  const me = useProfile();
  const [ouvert, setOuvert] = useState(false);
  const [texte, setTexte] = useState("");
  const [img, setImg] = useState<string | null>(null);
  const [emojis, setEmojis] = useState(false);
  const zone = useRef<HTMLTextAreaElement | null>(null);
  const fichier = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (ouvert) window.setTimeout(() => zone.current?.focus(), 50);
  }, [ouvert]);

  function fermer() {
    setOuvert(false);
    setEmojis(false);
  }

  function ouvrirAvecPhoto() {
    setOuvert(true);
    window.setTimeout(() => fichier.current?.click(), 80);
  }

  function publier(e: FormEvent) {
    e.preventDefault();
    const tx = texte.trim();
    if (!tx && !img) return toast("Écrivez un texte ou ajoutez une photo.");
    setTraversee((s) => ({ posts: [{ id: uid("p"), texte: tx, img: img ?? undefined, t: Date.now() }, ...s.posts] }));
    setTexte("");
    setImg(null);
    fermer();
    toast("Publication partagée avec les participants.");
  }

  async function choisir(f: File | undefined) {
    const u = await lisImage(f, 1080);
    if (u) setImg(u);
  }

  return (
    <>
      <Card bleed className={styles.composer}>
        <Avatar person={me} size={40} />
        <button type="button" className={styles.quoi} onClick={() => setOuvert(true)}>
          Quoi de neuf, {me.firstName} ?
        </button>
        <div className={styles.outilsC}>
          <button type="button" className={`${styles.outilC} ${styles.outilVideo}`} onClick={() => toast("Les vidéos arrivent dans la prochaine version.")} aria-label="Vidéo">
            <VideoIcon width={20} height={20} />
          </button>
          <button type="button" className={`${styles.outilC} ${styles.outilPhoto}`} onClick={ouvrirAvecPhoto} aria-label="Photo">
            <ImageIcon width={20} height={20} />
          </button>
          <button
            type="button"
            className={`${styles.outilC} ${styles.outilEmoji}`}
            onClick={() => {
              setOuvert(true);
              setEmojis(true);
            }}
            aria-label="Humeur"
          >
            <SmileIcon width={20} height={20} />
          </button>
        </div>
      </Card>

      {ouvert ? (
        <Modal onClose={fermer} label="Créer une publication" size="large">
          <form onSubmit={publier} className="grid gap-3.5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-[18px] text-graphite">Créer une publication</h3>
              <button type="button" onClick={fermer} aria-label="Fermer" className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-graphite-muted hover:bg-paper">
                <XIcon width={18} height={18} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Avatar person={me} size={44} />
              <div>
                <strong className="block text-graphite">{fullName(me)}</strong>
                <small className="text-graphite-muted">Visible par tous les participants</small>
              </div>
            </div>
            <textarea ref={zone} value={texte} onChange={(e) => setTexte(e.target.value)} className={styles.zoneTexte} placeholder={`Quoi de neuf, ${me.firstName} ?`} aria-label="Votre publication" maxLength={1200} />
            {img ? (
              <div className="relative">
                <img className={styles.une} src={img} alt="Photo jointe" />
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
              <span>Ajouter à votre publication</span>
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
            <Btn variant="primary" type="submit" disabled={!texte.trim() && !img} className="w-full">
              Publier
            </Btn>
          </form>
        </Modal>
      ) : null}
    </>
  );
}
