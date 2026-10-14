"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { FileTextIcon, ImageIcon, LayoutIcon, SpinnerIcon, UploadIcon } from "@/components/app/icons";
import { Modal } from "@/components/traversee/Modal";
import { Btn, Champ, ui } from "@/components/traversee/ui";
import { toast } from "@/lib/traversee/store";
import { CATEGORIES, type Categorie } from "@/lib/ressources/types";
import { creerPage, modifierRessource } from "@/app/(app)/admin/ressources/actions";
import { TAILLE_MAX_ENVOI, televerser, type OptionDossier } from "./outils";
import styles from "./admin.module.css";

export type RessourceEditable = {
  id: string;
  titre: string;
  categorie: Categorie;
  description: string | null;
  dossierId: string | null;
  couverture: boolean;
  couverturePerso: boolean;
};

type Props = { dossiers: OptionDossier[]; dossierParDefaut: string | null; ressource?: RessourceEditable; onClose: () => void };

const ACCEPTE = ".pdf,.docx,.mp4,.jpg,.jpeg,.png,.webp,application/pdf,video/mp4,image/jpeg,image/png,image/webp,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function tailleMo(o: number) {
  return `${(o / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`;
}

export function ModalRessource({ dossiers, dossierParDefaut, ressource, onClose }: Props) {
  const router = useRouter();
  const edition = Boolean(ressource);
  const [mode, setMode] = useState<"fichier" | "page">("fichier");
  const [titre, setTitre] = useState(ressource?.titre ?? "");
  const [categorie, setCategorie] = useState<Categorie>(ressource?.categorie ?? "guide");
  const [dossierId, setDossierId] = useState<string>(ressource ? (ressource.dossierId ?? "") : (dossierParDefaut ?? ""));
  const [description, setDescription] = useState(ressource?.description ?? "");
  const [fichier, setFichier] = useState<File | null>(null);
  const [couverture, setCouverture] = useState<File | null>(null);
  const [survol, setSurvol] = useState(false);
  const [pct, setPct] = useState<number | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const champFichier = useRef<HTMLInputElement | null>(null);

  function choisir(f: File | undefined | null) {
    if (!f) return;
    if (f.size > TAILLE_MAX_ENVOI) {
      setErreur("Fichier trop volumineux : 490 Mo maximum.");
      return;
    }
    setErreur(null);
    setFichier(f);
    if (!titre.trim()) setTitre(f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim());
  }

  function deposer(e: DragEvent) {
    e.preventDefault();
    setSurvol(false);
    choisir(e.dataTransfer.files?.[0]);
  }

  async function envoyerCouverture(id: string) {
    if (!couverture) return true;
    const r = await televerser(`/api/admin/ressources/${id}/couverture`, "PUT", couverture, {});
    if (r.statut >= 300) {
      toast(r.corps.message ?? "La couverture n’a pas pu être enregistrée.");
      return false;
    }
    return true;
  }

  async function valider(e: FormEvent) {
    e.preventDefault();
    if (enCours) return;
    const meta = { titre: titre.trim(), categorie, description: description.trim(), dossierId: dossierId || null };
    if (!meta.titre) return setErreur("Le titre est obligatoire.");
    setErreur(null);
    setEnCours(true);
    try {
      if (ressource) {
        const r = await modifierRessource(ressource.id, meta);
        if (!r.ok) return setErreur(r.message);
        await envoyerCouverture(ressource.id);
        toast("Ressource enregistrée.");
        router.refresh();
        onClose();
        return;
      }
      if (mode === "page") {
        const r = await creerPage(meta);
        if (!r.ok || !r.id) return setErreur(r.ok ? "Création impossible." : r.message);
        await envoyerCouverture(r.id);
        toast("Page créée : composez son contenu.");
        router.push(`/admin/ressources/${r.id}/contenu`);
        return;
      }
      if (!fichier) return setErreur("Choisissez le fichier à envoyer.");
      setPct(0);
      const r = await televerser("/api/admin/ressources", "POST", fichier, { "x-meta": encodeURIComponent(JSON.stringify(meta)), "x-nom-fichier": encodeURIComponent(fichier.name) }, setPct);
      if (r.statut >= 300 || !r.corps.id) {
        setPct(null);
        return setErreur(r.corps.message ?? "L’envoi a échoué.");
      }
      await envoyerCouverture(r.corps.id);
      toast("Ressource ajoutée à la bibliothèque.");
      router.push(`/admin/ressources/${r.corps.id}`);
    } finally {
      setEnCours(false);
    }
  }

  return (
    <Modal onClose={enCours ? () => undefined : onClose} label={edition ? "Modifier la ressource" : "Ajouter une ressource"} size="large">
      <form onSubmit={valider} className={styles.formulaire}>
        <h3 className="font-display text-[19px] text-graphite">{edition ? "Modifier la ressource" : "Ajouter une ressource"}</h3>
        {!edition ? (
          <div className={styles.modes} role="radiogroup" aria-label="Type de ressource">
            <button type="button" role="radio" aria-checked={mode === "fichier"} className={`${styles.mode} ${mode === "fichier" ? styles.modeOn : ""}`} onClick={() => setMode("fichier")}>
              <strong>
                <FileTextIcon width={18} height={18} />
                Envoyer un fichier
              </strong>
              <small>PDF, Word (.docx), vidéo MP4 ou photo. Converti pour la lecture protégée.</small>
            </button>
            <button type="button" role="radio" aria-checked={mode === "page"} className={`${styles.mode} ${mode === "page" ? styles.modeOn : ""}`} onClick={() => setMode("page")}>
              <strong>
                <LayoutIcon width={18} height={18} />
                Composer une page
              </strong>
              <small>Titres, texte mis en forme, photos et vidéos, sans fichier.</small>
            </button>
          </div>
        ) : null}

        {!edition && mode === "fichier" ? (
          <div
            className={`${styles.depot} ${survol ? styles.depotSurvol : ""}`}
            onClick={() => champFichier.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setSurvol(true);
            }}
            onDragLeave={() => setSurvol(false)}
            onDrop={deposer}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") champFichier.current?.click();
            }}
          >
            <UploadIcon />
            <strong>{fichier ? fichier.name : "Déposez le fichier ici ou cliquez pour le choisir"}</strong>
            <small>{fichier ? tailleMo(fichier.size) : "PDF, DOCX, MP4, JPEG, PNG ou WebP · 490 Mo maximum"}</small>
            <input ref={champFichier} type="file" accept={ACCEPTE} className="sr-only" onChange={(e) => choisir(e.target.files?.[0])} />
          </div>
        ) : null}

        <Champ label="Titre" htmlFor="rs-titre">
          <input id="rs-titre" className={ui.saisie} required maxLength={200} value={titre} onChange={(e) => setTitre(e.target.value)} />
        </Champ>
        <div className={styles.deux}>
          <Champ label="Catégorie" htmlFor="rs-cat">
            <select id="rs-cat" className={ui.saisie} value={categorie} onChange={(e) => setCategorie(e.target.value as Categorie)}>
              {(Object.keys(CATEGORIES) as Categorie[]).map((c) => (
                <option key={c} value={c}>
                  {CATEGORIES[c]}
                </option>
              ))}
            </select>
          </Champ>
          <Champ label="Dossier" htmlFor="rs-dossier">
            <select id="rs-dossier" className={ui.saisie} value={dossierId} onChange={(e) => setDossierId(e.target.value)}>
              <option value="">Bibliothèque (racine)</option>
              {dossiers.map((d) => (
                <option key={d.id} value={d.id}>
                  {`${"— ".repeat(d.profondeur - 1)}${d.libelle}`}
                </option>
              ))}
            </select>
          </Champ>
        </div>
        <Champ label="Description" htmlFor="rs-desc">
          <textarea id="rs-desc" className={`${ui.saisie} min-h-[84px] resize-y`} maxLength={600} value={description} onChange={(e) => setDescription(e.target.value)} />
          <small className={styles.compteur}>{description.length} / 600</small>
        </Champ>
        <Champ label="Couverture personnalisée" htmlFor="rs-couv" hint={ressource?.couverturePerso ? "Une couverture personnalisée est déjà en place." : "Facultatif : sinon la page 1 du document ou la première photo de la page."}>
          <label htmlFor="rs-couv" className={`${styles.outil} w-fit`}>
            <ImageIcon width={16} height={16} />
            {couverture ? couverture.name : "Choisir une image"}
          </label>
          <input id="rs-couv" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => setCouverture(e.target.files?.[0] ?? null)} />
        </Champ>

        {pct !== null ? (
          <div className="grid gap-1.5">
            <div className={styles.progression} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Envoi du fichier">
              <i style={{ width: `${pct}%` }} />
            </div>
            <small className="text-[12.5px] text-graphite-muted">{pct < 100 ? `Envoi : ${pct} %` : "Conversion en cours, cela peut prendre quelques instants…"}</small>
          </div>
        ) : null}
        {erreur ? <p className={styles.erreur}>{erreur}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Btn variant="primary" type="submit" disabled={enCours}>
            {enCours ? <SpinnerIcon width={16} height={16} className="animate-spin" /> : null}
            {edition ? "Enregistrer" : mode === "page" ? "Créer la page" : "Ajouter la ressource"}
          </Btn>
          <Btn type="button" onClick={onClose} disabled={enCours}>
            Annuler
          </Btn>
        </div>
      </form>
    </Modal>
  );
}
