"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supprimerPhotoGalerie } from "@/app/(app)/galerie/actions";
import { DownloadIcon, PlayIcon, PlusIcon } from "@/components/app/icons";
import type { PhotoVue } from "@/lib/traversee/galerie";
import { lisImage, toast } from "@/lib/traversee/store";
import { Modal } from "../Modal";
import { Btn, FileBtn, Onglets, PageHead, Puce, Vide, ui } from "../ui";
import styles from "./photos.module.css";

export function Vignette({ m, tag, onOpen, i, children }: { m: { src: string; video?: boolean }; tag?: { texte: string; rouge?: boolean }; onOpen?: () => void; i: number; children?: React.ReactNode }) {
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

/** Photo réduite dans le navigateur puis inscrite dans la galerie par le serveur. */
async function envoyerPhoto(dataUrl: string) {
  const blob = await (await fetch(dataUrl)).blob();
  const r = await fetch("/api/photos", { method: "POST", headers: { "Content-Type": blob.type || "image/jpeg" }, body: blob });
  const d = (await r.json().catch(() => ({}))) as { ok?: boolean; message?: string };
  if (!r.ok || !d.ok) throw new Error(d.message ?? "La photo n’a pas pu être enregistrée.");
}

/** Galerie de l'événement (en base) : photos de l'équipe et photos partagées par les participants. */
export function Photos({ photos }: { photos: PhotoVue[] }) {
  const router = useRouter();
  const [vue, setVue] = useState<"toutes" | "moi">("toutes");
  const [grand, setGrand] = useState<PhotoVue | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const miennes = photos.filter((m) => m.aMoi);
  const liste = vue === "toutes" ? photos : miennes;

  async function ajouter(files: FileList | null) {
    const fichiers = Array.from(files ?? []);
    if (!fichiers.length) return;
    setEnvoi(true);
    let ok = 0;
    for (const f of fichiers) {
      const u = await lisImage(f, 1280);
      if (!u) continue;
      try {
        await envoyerPhoto(u);
        ok++;
      } catch (e) {
        toast(e instanceof Error ? e.message : "La photo n’a pas pu être enregistrée.");
      }
    }
    setEnvoi(false);
    if (ok) {
      toast(`${ok} photo${ok > 1 ? "s ajoutées" : " ajoutée"} à la galerie.`);
      router.refresh();
    }
  }

  async function retirer(m: PhotoVue) {
    const { error } = await supprimerPhotoGalerie(m.id);
    if (error) return toast(error);
    setGrand(null);
    toast("Photo retirée de la galerie.");
    router.refresh();
  }

  return (
    <>
      <PageHead title="Photos et" accent="vidéos" text="La galerie se remplit en direct pendant l’événement. Ajoutez-y vos propres photos." photo="public">
        <FileBtn
          variant="primary"
          label={
            <>
              <PlusIcon width={16} height={16} />
              {envoi ? "Envoi…" : "Ajouter mes photos"}
            </>
          }
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={envoi}
          aria-label="Ajouter mes photos à la galerie"
          onChange={(e) => {
            const f = e.target.files;
            void ajouter(f).finally(() => (e.target.value = ""));
          }}
        />
      </PageHead>
      <div className={ui.outils}>
        <Onglets
          items={[
            { v: "toutes", label: "Toutes" },
            { v: "moi", label: "Mes photos", disabled: !miennes.length },
          ]}
          value={vue}
          onChange={setVue}
          label="Affichage"
        />
        <Puce tone="grey">
          {photos.length} photo{photos.length > 1 ? "s" : ""}
        </Puce>
      </div>
      {liste.length ? (
        <div className={styles.mur}>
          {liste.map((m, i) => (
            <Vignette key={m.id} m={m} i={i} onOpen={() => setGrand(m)} tag={m.aMoi ? { texte: "Votre photo", rouge: true } : undefined} />
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
            {grand.aMoi ? (
              <Btn className="!text-[#b42318]" onClick={() => void retirer(grand)}>
                Retirer ma photo
              </Btn>
            ) : null}
            <Btn onClick={() => setGrand(null)}>Fermer</Btn>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
