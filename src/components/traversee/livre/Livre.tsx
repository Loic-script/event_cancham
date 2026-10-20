"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { deposerSouvenir, retirerMonSouvenir } from "@/app/(app)/livre/actions";
import { PlusIcon } from "@/components/app/icons";
import { envoyerVideo } from "@/lib/traversee/envoi";
import { MAX_TEXTE_SOUVENIR, type SouvenirVue } from "@/lib/traversee/livre";
import { toast } from "@/lib/traversee/store";
import { Btn, Card, Champ, FileBtn, PageHead, Puce, Recherche, Sur, Vide, ui } from "../ui";
import styles from "./livre.module.css";

const VIDEO_MAX = 100 * 1024 * 1024;

/** Durée lue dans les métadonnées de la vidéo, avant l'envoi. */
function lireDuree(url: string): Promise<number | null> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => resolve(Number.isFinite(v.duration) ? v.duration : null);
    v.onerror = () => resolve(null);
    v.src = url;
  });
}

function Depot({ onFini }: { onFini: () => void }) {
  const router = useRouter();
  const [video, setVideo] = useState<{ file: File; apercu: string; duree: number | null } | null>(null);
  const [texte, setTexte] = useState("");
  const [envoi, setEnvoi] = useState<number | null>(null);

  useEffect(() => () => (video ? URL.revokeObjectURL(video.apercu) : undefined), [video]);

  async function choisir(f: File | undefined) {
    if (!f) return;
    if (!/^video\/(mp4|quicktime|webm)$/.test(f.type)) return toast("Choisissez une vidéo MP4, MOV ou WebM.");
    if (f.size > VIDEO_MAX) return toast("Vidéo trop lourde : 100 Mo maximum.");
    const apercu = URL.createObjectURL(f);
    setVideo({ file: f, apercu, duree: await lireDuree(apercu) });
  }

  async function envoyer(e: FormEvent) {
    e.preventDefault();
    if (!video || envoi !== null) return;
    setEnvoi(0);
    try {
      const url = await envoyerVideo(video.file, setEnvoi);
      const { error } = await deposerSouvenir(url, video.duree, texte);
      if (error) throw new Error(error);
    } catch (err) {
      setEnvoi(null);
      return toast(err instanceof Error ? err.message : "La vidéo n’a pas pu être envoyée.");
    }
    setEnvoi(null);
    toast("Vidéo envoyée. Elle sera publiée après validation par l’équipe CanCham.");
    router.refresh();
    onFini();
  }

  return (
    <form onSubmit={(e) => void envoyer(e)} className="grid gap-3">
      {video ? <video src={video.apercu} controls preload="metadata" className="max-h-72 w-full rounded-xl bg-black" /> : null}
      <FileBtn
        label={
          <>
            <PlusIcon width={16} height={16} />
            {video ? "Choisir une autre vidéo" : "Choisir ma vidéo"}
          </>
        }
        accept="video/mp4,video/quicktime,video/webm"
        aria-label="Choisir ma vidéo souvenir"
        disabled={envoi !== null}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          void choisir(f);
        }}
      />
      <Champ label="Votre message (facultatif)" htmlFor="livre-texte">
        <textarea id="livre-texte" className={ui.saisie} style={{ minHeight: 80 }} maxLength={MAX_TEXTE_SOUVENIR} value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Ce que vous retenez de La Traversée, en quelques mots…" />
      </Champ>
      <div className="flex flex-wrap gap-2">
        <Btn variant="primary" type="submit" disabled={!video || envoi !== null}>
          {envoi !== null ? `Envoi de la vidéo… ${envoi} %` : "Envoyer ma vidéo"}
        </Btn>
        <Btn onClick={onFini} disabled={envoi !== null}>
          Annuler
        </Btn>
      </div>
    </form>
  );
}

/** Livre d'or vidéo (en base) : pages validées par l'équipe, et dépôt de son propre souvenir. */
export function Livre({ publies, miens }: { publies: SouvenirVue[]; miens: SouvenirVue[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [pl, setPl] = useState(0);
  const [depot, setDepot] = useState(false);
  const [anim, setAnim] = useState<"" | "tourneAv" | "tourneAr" | "arriveAv" | "arriveAr">("");
  const n = publies.length;
  const i = Math.min(pl, Math.max(0, n - 1));
  const p = publies[i];

  function tourner(sens: 1 | -1) {
    const calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (calme) {
      setPl(i + sens);
      return;
    }
    setAnim(sens > 0 ? "tourneAv" : "tourneAr");
    window.setTimeout(() => {
      setPl(i + sens);
      setAnim(sens > 0 ? "arriveAv" : "arriveAr");
      window.setTimeout(() => setAnim(""), 420);
    }, 330);
  }

  function chercher(v: string) {
    setQ(v);
    const ql = v.toLowerCase().trim();
    if (!ql) return;
    const k = publies.findIndex((l) => `${l.nom} ${l.ent} ${l.texte}`.toLowerCase().includes(ql));
    if (k >= 0 && k !== i) setPl(k);
  }

  async function retirer(id: string) {
    const { error } = await retirerMonSouvenir(id);
    if (error) return toast(error);
    toast("Vidéo retirée.");
    router.refresh();
  }

  return (
    <>
      <PageHead title="Livre d’or" accent="vidéo" text="Feuilletez les souvenirs des participants, page après page." photo="musique" />
      <div className={ui.outils}>
        <Recherche value={q} onChange={chercher} placeholder="Rechercher un nom ou un mot dans les souvenirs…" label="Rechercher dans les souvenirs" className={ui.recherche} />
        <Puce tone="grey">
          {n} souvenir{n > 1 ? "s" : ""}
        </Puce>
      </div>
      {p ? (
        <div className={styles.livre}>
          <div className={`${styles.pages} ${anim ? styles[anim] : ""} m-bleed`}>
            <div className={`${styles.page} ${styles.pg}`}>
              <div className={styles.media}>
                <video key={p.id} controls preload="metadata" src={p.video} />
                {p.duree ? <span className={styles.duree}>{p.duree}</span> : null}
              </div>
            </div>
            <div className={`${styles.page} ${styles.pd}`}>
              <Sur>
                Souvenir {i + 1} sur {n}
              </Sur>
              <h3>{p.nom}</h3>
              {p.ent ? <p className="text-graphite-muted">{p.ent}</p> : null}
              {p.texte ? <blockquote>« {p.texte} »</blockquote> : null}
            </div>
          </div>
          <div className={styles.nav}>
            <Btn disabled={i === 0 || anim !== ""} onClick={() => tourner(-1)}>
              ← Page précédente
            </Btn>
            <span>
              {i + 1} / {n}
            </span>
            <Btn variant="primary" disabled={i >= n - 1 || anim !== ""} onClick={() => tourner(1)}>
              Tourner la page →
            </Btn>
          </div>
        </div>
      ) : (
        <Vide>Le livre d’or est encore vide : soyez le premier à y laisser un souvenir.</Vide>
      )}
      <Card pad bleed className="mt-5 grid gap-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3.5">
          <div>
            <Sur className="!mb-1.5">Votre souvenir</Sur>
            <strong className="text-graphite">Ajoutez votre page au livre d’or</strong>
            <p className="text-graphite-muted">Une courte vidéo et quelques mots : elle est publiée après validation par l’équipe CanCham. MP4, MOV ou WebM, 100 Mo maximum.</p>
          </div>
          {depot ? null : (
            <Btn variant="primary" onClick={() => setDepot(true)}>
              <PlusIcon width={16} height={16} />
              Ajouter ma vidéo
            </Btn>
          )}
        </div>
        {depot ? <Depot onFini={() => setDepot(false)} /> : null}
        {miens.length ? (
          <ul className={ui.liste}>
            {miens.map((l) => (
              <li key={l.id}>
                <Puce tone={l.etat === "refuse" ? "grey" : "red"}>{l.etat === "refuse" ? "Non retenue" : "En attente de validation"}</Puce>
                <div className="min-w-0 flex-1">
                  <strong>Votre vidéo{l.duree ? ` · ${l.duree}` : ""}</strong>
                  <small>{l.texte || "Sans message"}</small>
                </div>
                <Btn small onClick={() => void retirer(l.id)}>
                  Retirer
                </Btn>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>
    </>
  );
}
