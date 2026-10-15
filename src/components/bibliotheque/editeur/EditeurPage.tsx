"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon, ArrowDownIcon, ArrowLeftIcon, ArrowUpIcon, CheckIcon, EyeIcon, FilmIcon, GripIcon, ImageIcon, PencilIcon, SpinnerIcon, TrashIcon, TypeIcon, UploadIcon } from "@/components/app/icons";
import { Btn, ui } from "@/components/traversee/ui";
import { toast } from "@/lib/traversee/store";
import { COULEURS, integration, type Align, type Bloc, type BlocPhoto, type BlocTitre, type BlocVideo } from "@/lib/ressources/blocs";
import { enregistrerContenu } from "@/app/(app)/admin/ressources/actions";
import { BlocsRendu } from "../Blocs";
import { televerser } from "../admin/outils";
import { EditeurTexte } from "./EditeurTexte";
import base from "../bibliotheque.module.css";
import styles from "./editeur.module.css";

type Props = { id: string; titre: string; blocsInitiaux: Bloc[]; lienRetour: string };

const NOMS: Record<Bloc["type"], string> = { titre: "Titre", texte: "Texte", photo: "Photo", video: "Vidéo" };

function nouvelId() {
  return `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function nouveauBloc(type: Bloc["type"]): Bloc {
  const id = nouvelId();
  if (type === "titre") return { id, type, niveau: 2, texte: "", align: "left" };
  if (type === "texte") return { id, type, paragraphes: [{ type: "p", align: "left", items: [[]] }] };
  if (type === "photo") return { id, type, fichier: null, legende: "" };
  return { id, type, fichier: null, url: null };
}

function resume(b: Bloc): string {
  if (b.type === "titre") return b.texte || "Titre sans texte";
  if (b.type === "texte") return b.paragraphes.map((p) => p.items.flat().map((r) => r.t).join("")).join(" ").slice(0, 60) || "Texte vide";
  if (b.type === "photo") return b.legende || (b.fichier ? "Photo" : "Photo à choisir");
  return b.fichier ? "Vidéo envoyée" : b.url ? (integration(b.url)?.fournisseur ?? "Lien vidéo") : "Vidéo à choisir";
}

function Alignement({ valeur, onChange }: { valeur: Align; onChange: (a: Align) => void }) {
  const options: [Align, React.ReactNode, string][] = [
    ["left", <AlignLeftIcon key="g" width={15} height={15} />, "À gauche"],
    ["center", <AlignCenterIcon key="c" width={15} height={15} />, "Centré"],
    ["right", <AlignRightIcon key="d" width={15} height={15} />, "À droite"],
  ];
  return (
    <span className={styles.groupe} role="group" aria-label="Alignement">
      {options.map(([v, icone, label]) => (
        <button key={v} type="button" aria-pressed={valeur === v} aria-label={label} title={label} onClick={() => onChange(v)}>
          {icone}
        </button>
      ))}
    </span>
  );
}

function EditeurTitre({ b, maj }: { b: BlocTitre; maj: (p: Partial<BlocTitre>) => void }) {
  return (
    <>
      <input
        className={`${styles.titreSaisie} ${b.niveau === 2 ? styles.titre2 : styles.titre3}`}
        style={{ textAlign: b.align, color: b.couleur }}
        value={b.texte}
        maxLength={300}
        placeholder="Écrivez le titre…"
        aria-label="Texte du titre"
        onChange={(e) => maj({ texte: e.target.value })}
      />
      <div className={styles.ligne}>
        <span className={styles.groupe} role="group" aria-label="Niveau du titre">
          <button type="button" aria-pressed={b.niveau === 2} onClick={() => maj({ niveau: 2 })}>
            Titre 2
          </button>
          <button type="button" aria-pressed={b.niveau === 3} onClick={() => maj({ niveau: 3 })}>
            Titre 3
          </button>
        </span>
        <Alignement valeur={b.align} onChange={(align) => maj({ align })} />
        <span className={styles.pastilles} role="group" aria-label="Couleur du titre">
          <button type="button" aria-pressed={!b.couleur} title="Couleur par défaut" aria-label="Couleur par défaut" style={{ background: "#1b2430" }} onClick={() => maj({ couleur: undefined })} />
          {COULEURS.map((c) => (
            <button key={c.valeur} type="button" aria-pressed={b.couleur === c.valeur} title={c.nom} aria-label={`Couleur ${c.nom}`} style={{ background: c.valeur }} onClick={() => maj({ couleur: c.valeur })} />
          ))}
        </span>
      </div>
    </>
  );
}

function useEnvoi(id: string) {
  const [pct, setPct] = useState<number | null>(null);
  async function envoyer(f: File, attendu: "photo" | "video"): Promise<string | null> {
    if (attendu === "photo" && !/^image\/(jpeg|png|webp)$/.test(f.type)) {
      toast("Choisissez une photo JPEG, PNG ou WebP.");
      return null;
    }
    if (attendu === "video" && f.type !== "video/mp4") {
      toast("Choisissez une vidéo MP4.");
      return null;
    }
    setPct(0);
    const r = await televerser(`/api/admin/ressources/${id}/blocs`, "POST", f, {}, setPct);
    setPct(null);
    if (r.statut >= 300 || !r.corps.fichier) {
      toast(r.corps.message ?? "L’envoi a échoué.");
      return null;
    }
    return r.corps.fichier;
  }
  return { pct, envoyer };
}

function Progression({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  return (
    <div className="grid gap-1">
      <div className={styles.progression}>
        <i style={{ width: `${pct}%` }} />
      </div>
      <small className={styles.indice}>{pct < 100 ? `Envoi : ${pct} %` : "Traitement…"}</small>
    </div>
  );
}

function EditeurPhoto({ id, b, maj }: { id: string; b: BlocPhoto; maj: (p: Partial<BlocPhoto>) => void }) {
  const { pct, envoyer } = useEnvoi(id);
  const champ = useRef<HTMLInputElement | null>(null);
  async function choisir(f: File | undefined) {
    if (!f) return;
    const nom = await envoyer(f, "photo");
    if (nom) maj({ fichier: nom });
    if (champ.current) champ.current.value = "";
  }
  return (
    <>
      {b.fichier ? (
        <div className={styles.media}>
          <img src={`/api/ressources/${id}/blocs/${b.fichier}`} alt={b.legende} />
        </div>
      ) : (
        <button type="button" className={styles.depot} onClick={() => champ.current?.click()}>
          <ImageIcon />
          <strong>Choisir une photo</strong>
          <small>JPEG, PNG ou WebP · convertie en WebP</small>
        </button>
      )}
      <input ref={champ} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => choisir(e.target.files?.[0])} />
      <Progression pct={pct} />
      <div className={styles.ligne}>
        <input className={`${ui.saisie} flex-1`} placeholder="Légende (facultatif)" maxLength={300} value={b.legende} onChange={(e) => maj({ legende: e.target.value })} aria-label="Légende de la photo" />
        {b.fichier ? (
          <Btn small onClick={() => champ.current?.click()}>
            <UploadIcon width={15} height={15} />
            Remplacer
          </Btn>
        ) : null}
      </div>
    </>
  );
}

function EditeurVideo({ id, b, maj }: { id: string; b: BlocVideo; maj: (p: Partial<BlocVideo>) => void }) {
  const { pct, envoyer } = useEnvoi(id);
  const champ = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<"fichier" | "lien">(b.url ? "lien" : "fichier");
  const [lien, setLien] = useState(b.url ?? "");
  const integ = lien.trim() ? integration(lien) : null;

  async function choisir(f: File | undefined) {
    if (!f) return;
    const nom = await envoyer(f, "video");
    if (nom) maj({ fichier: nom, url: null });
    if (champ.current) champ.current.value = "";
  }

  return (
    <>
      <span className={styles.groupe} role="group" aria-label="Source de la vidéo">
        <button type="button" aria-pressed={mode === "fichier"} onClick={() => setMode("fichier")}>
          Fichier MP4
        </button>
        <button type="button" aria-pressed={mode === "lien"} onClick={() => setMode("lien")}>
          YouTube, Vimeo ou Drive
        </button>
      </span>
      {mode === "fichier" ? (
        <>
          {b.fichier ? (
            <div className={styles.media}>
              <video src={`/api/ressources/${id}/blocs/${b.fichier}`} controls controlsList="nodownload" disablePictureInPicture preload="metadata" />
            </div>
          ) : (
            <button type="button" className={styles.depot} onClick={() => champ.current?.click()}>
              <FilmIcon />
              <strong>Choisir une vidéo MP4</strong>
              <small>Servie en lecture protégée, avance rapide possible · 490 Mo maximum</small>
            </button>
          )}
          <input ref={champ} type="file" accept="video/mp4" className="sr-only" onChange={(e) => choisir(e.target.files?.[0])} />
          <Progression pct={pct} />
          {b.fichier ? (
            <div>
              <Btn small onClick={() => champ.current?.click()}>
                <UploadIcon width={15} height={15} />
                Remplacer la vidéo
              </Btn>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <input
            className={ui.saisie}
            placeholder="https://www.youtube.com/watch?v=…"
            value={lien}
            onChange={(e) => {
              setLien(e.target.value);
              const ok = integration(e.target.value);
              maj(ok ? { url: e.target.value.trim(), fichier: null } : { url: null });
            }}
            aria-label="Lien de la vidéo"
          />
          {lien.trim() ? (
            integ ? (
              <>
                <small className={`${styles.indice} ${styles.indiceOk}`}>Vidéo {integ.fournisseur} reconnue{integ.fournisseur === "YouTube" ? " · lecture sans cookie (youtube-nocookie)" : ""}.</small>
                <div className={styles.media}>
                  <iframe src={integ.src} title={`Aperçu ${integ.fournisseur}`} loading="lazy" allow="encrypted-media; fullscreen" allowFullScreen />
                </div>
              </>
            ) : (
              <small className={`${styles.indice} ${styles.indiceErreur}`}>Lien non reconnu : collez l’adresse d’une vidéo YouTube, Vimeo ou Google Drive.</small>
            )
          ) : null}
        </>
      )}
    </>
  );
}

export function EditeurPage({ id, titre, blocsInitiaux, lienRetour }: Props) {
  const router = useRouter();
  const [blocs, setBlocs] = useState<Bloc[]>(blocsInitiaux);
  const [sale, setSale] = useState(false);
  const [apercu, setApercu] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [glisse, setGlisse] = useState<string | null>(null);
  const [cible, setCible] = useState<string | null>(null);

  useEffect(() => {
    if (!sale) return;
    const avertir = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", avertir);
    return () => window.removeEventListener("beforeunload", avertir);
  }, [sale]);

  function changer(fn: (l: Bloc[]) => Bloc[]) {
    setBlocs(fn);
    setSale(true);
  }

  function maj(idBloc: string, patch: Partial<Bloc>) {
    changer((l) => l.map((b) => (b.id === idBloc ? ({ ...b, ...patch } as Bloc) : b)));
  }

  function ajouter(type: Bloc["type"]) {
    const b = nouveauBloc(type);
    changer((l) => [...l, b]);
    window.setTimeout(() => document.getElementById(`bloc-${b.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  }

  function deplacer(idBloc: string, sens: -1 | 1) {
    changer((l) => {
      const i = l.findIndex((b) => b.id === idBloc);
      const j = i + sens;
      if (i < 0 || j < 0 || j >= l.length) return l;
      const n = [...l];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
  }

  function deposer(e: DragEvent, surId: string) {
    e.preventDefault();
    const source = glisse;
    setGlisse(null);
    setCible(null);
    if (!source || source === surId) return;
    changer((l) => {
      const b = l.find((x) => x.id === source);
      if (!b) return l;
      const n = l.filter((x) => x.id !== source);
      n.splice(n.findIndex((x) => x.id === surId), 0, b);
      return n;
    });
  }

  async function enregistrer() {
    setEnCours(true);
    const r = await enregistrerContenu(id, blocs);
    setEnCours(false);
    if (!r.ok) return toast(r.message);
    setSale(false);
    toast("Page enregistrée.");
    router.refresh();
  }

  return (
    <>
      <div className={styles.entete}>
        <Link href={lienRetour} className={`${styles.mini} !w-auto !px-2 gap-1 inline-flex items-center text-[13px] font-bold`} aria-label="Retour à la ressource">
          <ArrowLeftIcon width={16} height={16} />
        </Link>
        <h1>{titre}</h1>
        <span className={`${styles.etat} ${sale ? styles.etatSale : ""}`}>
          <i />
          {sale ? "Modifications non enregistrées" : "Enregistré"}
        </span>
        <Btn small onClick={() => setApercu((v) => !v)}>
          {apercu ? <PencilIcon width={15} height={15} /> : <EyeIcon width={15} height={15} />}
          {apercu ? "Modifier" : "Aperçu"}
        </Btn>
        <Btn small variant="primary" onClick={enregistrer} disabled={enCours || !sale}>
          {enCours ? <SpinnerIcon width={15} height={15} className="animate-spin" /> : <CheckIcon width={15} height={15} />}
          Enregistrer
        </Btn>
      </div>

      <div className={styles.editeur}>
        <div className="min-w-0">
          {apercu ? (
            <div className={base.pageComposee}>{blocs.length ? <BlocsRendu blocs={blocs} fichier={(nom) => `/api/ressources/${id}/blocs/${nom}`} /> : <p className="text-graphite-muted">La page est vide.</p>}</div>
          ) : (
            <div className={styles.blocs}>
              {blocs.length ? null : (
                <div className={styles.vide}>
                  <TypeIcon width={26} height={26} />
                  <p>La page est vide. Ajoutez un titre, du texte, une photo ou une vidéo.</p>
                </div>
              )}
              {blocs.map((b, i) => (
                <section
                  key={b.id}
                  id={`bloc-${b.id}`}
                  className={`${styles.bloc} ${glisse === b.id ? styles.blocGlisse : ""} ${cible === b.id && glisse !== b.id ? styles.blocCible : ""}`}
                  onDragOver={(e) => {
                    if (!glisse) return;
                    e.preventDefault();
                    setCible(b.id);
                  }}
                  onDrop={(e) => deposer(e, b.id)}
                  aria-label={`Bloc ${i + 1} : ${NOMS[b.type]}`}
                >
                  <div className={styles.blocTete}>
                    <span
                      className={styles.poignee}
                      draggable
                      onDragStart={(e) => {
                        setGlisse(b.id);
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", b.id);
                      }}
                      onDragEnd={() => {
                        setGlisse(null);
                        setCible(null);
                      }}
                      title="Glisser pour déplacer"
                      aria-hidden
                    >
                      <GripIcon width={16} height={16} />
                    </span>
                    <strong>
                      {i + 1}. {NOMS[b.type]}
                    </strong>
                    <button type="button" className={styles.mini} aria-label="Monter" disabled={i === 0} onClick={() => deplacer(b.id, -1)}>
                      <ArrowUpIcon width={15} height={15} />
                    </button>
                    <button type="button" className={styles.mini} aria-label="Descendre" disabled={i === blocs.length - 1} onClick={() => deplacer(b.id, 1)}>
                      <ArrowDownIcon width={15} height={15} />
                    </button>
                    <button type="button" className={`${styles.mini} ${styles.miniDanger}`} aria-label="Supprimer le bloc" onClick={() => changer((l) => l.filter((x) => x.id !== b.id))}>
                      <TrashIcon width={15} height={15} />
                    </button>
                  </div>
                  <div className={styles.blocCorps}>
                    {b.type === "titre" ? <EditeurTitre b={b} maj={(p) => maj(b.id, p)} /> : null}
                    {b.type === "texte" ? <EditeurTexte key={b.id} valeur={b.paragraphes} label={`Texte du bloc ${i + 1}`} onChange={(paragraphes) => maj(b.id, { paragraphes })} /> : null}
                    {b.type === "photo" ? <EditeurPhoto id={id} b={b} maj={(p) => maj(b.id, p)} /> : null}
                    {b.type === "video" ? <EditeurVideo id={id} b={b} maj={(p) => maj(b.id, p)} /> : null}
                  </div>
                </section>
              ))}
              <div className={styles.ajouter} role="group" aria-label="Ajouter un bloc">
                <button type="button" onClick={() => ajouter("titre")}>
                  <TypeIcon width={16} height={16} />
                  Titre
                </button>
                <button type="button" onClick={() => ajouter("texte")}>
                  <AlignLeftIcon width={16} height={16} />
                  Texte
                </button>
                <button type="button" onClick={() => ajouter("photo")}>
                  <ImageIcon width={16} height={16} />
                  Photo
                </button>
                <button type="button" onClick={() => ajouter("video")}>
                  <FilmIcon width={16} height={16} />
                  Vidéo
                </button>
              </div>
            </div>
          )}
        </div>
        <aside className={styles.cote}>
          <div className={styles.carteCote}>
            <small>Plan de la page</small>
            {blocs.length ? (
              <div className={styles.plan}>
                {blocs.map((b, i) => (
                  <button key={b.id} type="button" onClick={() => document.getElementById(`bloc-${b.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}>
                    <b>{i + 1}</b>
                    <span>
                      {NOMS[b.type]} · {resume(b)}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p>Aucun bloc pour l’instant.</p>
            )}
          </div>
          <div className={styles.carteCote}>
            <small>Bon à savoir</small>
            <p>Le texte est enregistré sous forme structurée, sans HTML. Les photos sont converties en WebP et servies par une route protégée. Les fichiers retirés de la page sont effacés à l’enregistrement.</p>
          </div>
        </aside>
      </div>
    </>
  );
}
