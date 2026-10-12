"use client";

import { useState } from "react";
import { DownloadIcon, PlayIcon, PlusIcon } from "@/components/app/icons";
import { useProfile } from "@/components/profile/useProfile";
import { GALERIE, type Media } from "@/lib/traversee/data";
import { lisImage, setTraversee, toast, uid, useTraversee, type TraverseeState } from "@/lib/traversee/store";
import { Modal } from "../Modal";
import { Btn, Card, FileBtn, Note, Onglets, PageHead, Puce, Vide, ui } from "../ui";
import styles from "./photos.module.css";

export function galerie(s: TraverseeState): Media[] {
  const ajoutees: Media[] = s.galAjoutees.map((m) => ({ id: m.id, src: m.src, video: false, par: "vous", moi: true }));
  return [...ajoutees, ...GALERIE].filter((m) => !s.galSupprimees.includes(m.id));
}

export function Vignette({ m, tag, onOpen, i, children }: { m: Media; tag?: { texte: string; rouge?: boolean }; onOpen?: () => void; i: number; children?: React.ReactNode }) {
  const Tag = onOpen ? "button" : "div";
  return (
    <Tag type={onOpen ? "button" : undefined} className={`${styles.vignette} ${onOpen ? "" : styles.adm}`} style={{ "--i": Math.min(i, 12) } as React.CSSProperties} onClick={onOpen} aria-label={onOpen ? "Agrandir la photo" : undefined}>
      <img src={m.src} alt="" loading="lazy" />
      {m.video ? (
        <>
          <span className={styles.lire}>
            <PlayIcon fill="currentColor" strokeWidth={0} />
          </span>
          <span className={styles.et}>Vidéo</span>
        </>
      ) : null}
      {tag ? <span className={`${styles.et} ${styles.etDroite} ${tag.rouge ? styles.etRouge : ""}`}>{tag.texte}</span> : null}
      {children}
    </Tag>
  );
}

function telecharger(src: string, nom: string) {
  const a = document.createElement("a");
  a.href = src;
  a.download = nom;
  a.target = "_blank";
  a.rel = "noreferrer";
  a.click();
}

export function Photos() {
  const s = useTraversee();
  const me = useProfile();
  const [vue, setVue] = useState<"toutes" | "moi">("toutes");
  const [scan, setScan] = useState(false);
  const [grand, setGrand] = useState<Media | null>(null);
  const gal = galerie(s);
  const miennes = gal.filter((m) => m.moi || m.par === "vous");
  const liste = vue === "toutes" ? gal : miennes;
  const aDesPhotos = s.retrouve || gal.some((m) => m.par === "vous");

  function retrouver() {
    if (!me.photo) return toast("Ajoutez d’abord une photo de profil.");
    setScan(true);
    window.setTimeout(() => {
      setScan(false);
      setTraversee({ retrouve: true });
      setVue("moi");
      toast(`${gal.filter((m) => m.moi).length} photos et vidéos retrouvées.`);
    }, 2200);
  }

  async function ajouter(files: FileList | null) {
    const liste = Array.from(files ?? []);
    if (!liste.length) return;
    const urls = (await Promise.all(liste.map((f) => lisImage(f, 1280)))).filter((u): u is string => Boolean(u));
    if (!urls.length) return;
    setTraversee((st) => ({ galAjoutees: [...urls.map((src) => ({ id: uid("u"), src })), ...st.galAjoutees] }));
    toast(`${urls.length} photo${urls.length > 1 ? "s ajoutées" : " ajoutée"} à la galerie.`);
  }

  return (
    <>
      <PageHead title="Photos et" accent="vidéos" text="La galerie se remplit en direct pendant l’événement. Ajoutez-y vos propres photos." photo="public">
        <FileBtn
          variant="primary"
          label={
            <>
              <PlusIcon width={16} height={16} />
              Ajouter mes photos
            </>
          }
          accept="image/*"
          multiple
          aria-label="Ajouter mes photos à la galerie"
          onChange={(e) => void ajouter(e.target.files)}
        />
      </PageHead>
      <div className={ui.outils}>
        <Onglets
          items={[
            { v: "toutes", label: "Toutes" },
            { v: "moi", label: "Mes photos", disabled: !aDesPhotos },
          ]}
          value={vue}
          onChange={setVue}
          label="Affichage"
        />
        <Puce tone="grey">{gal.length} photos et vidéos</Puce>
      </div>
      {!s.visage ? (
        <Note className="mb-4">
          Pour retrouver automatiquement vos photos et vidéos, activez la reconnaissance faciale dans votre{" "}
          <a href="/profil" className="font-bold underline underline-offset-4">
            profil
          </a>
          . Elle est facultative et vous pouvez la couper à tout moment.
        </Note>
      ) : !s.retrouve ? (
        <Card pad bleed className="mb-4 flex flex-wrap items-center justify-between gap-3.5">
          <div>
            <strong className="text-graphite">Retrouvez-vous dans la galerie</strong>
            <p className="text-graphite-muted">La plateforme compare votre photo de profil aux photos et vidéos de l’événement.</p>
          </div>
          <Btn variant="primary" onClick={retrouver} disabled={scan}>
            {scan ? "Recherche en cours…" : "Me retrouver"}
          </Btn>
        </Card>
      ) : (
        <Note tone="green" className="mb-4">
          {gal.filter((m) => m.moi).length} photos et vidéos où vous apparaissez (résultat simulé dans cette maquette).
        </Note>
      )}
      {liste.length ? (
        <div className={`${styles.mur} ${scan ? styles.scan : ""}`}>
          {liste.map((m, i) => (
            <Vignette key={m.id} m={m} i={i} onOpen={() => setGrand(m)} tag={m.par === "vous" ? { texte: "Votre photo", rouge: true } : s.retrouve && m.moi ? { texte: "Vous", rouge: true } : undefined} />
          ))}
        </div>
      ) : (
        <Vide>Aucune photo pour l’instant.</Vide>
      )}
      {grand ? (
        <Modal onClose={() => setGrand(null)} label="Photo de l’événement" className={styles.grand}>
          <img src={grand.src} alt="Photo de l’événement" />
          <div className="flex flex-wrap justify-center gap-2">
            <Btn variant="primary" onClick={() => telecharger(grand.src, "la-traversee-photo.jpg")}>
              <DownloadIcon width={16} height={16} />
              Télécharger
            </Btn>
            <Btn onClick={() => setGrand(null)}>Fermer</Btn>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
