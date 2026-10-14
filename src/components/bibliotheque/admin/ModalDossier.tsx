"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ImageIcon, SpinnerIcon, TrashIcon } from "@/components/app/icons";
import { Modal } from "@/components/traversee/Modal";
import { Btn, Champ, ui } from "@/components/traversee/ui";
import { toast } from "@/lib/traversee/store";
import { creerDossier, modifierDossier } from "@/app/(app)/admin/ressources/actions";
import { imageDossier } from "../liens";
import { televerser, type OptionDossier } from "./outils";
import styles from "./admin.module.css";

export type DossierEditable = {
  id: string;
  nom: string;
  parentId: string | null;
  auteurNom: string | null;
  auteurRole: string | null;
  auteurBio: string | null;
  couverture: boolean;
  auteurPhoto: boolean;
};

type Props = { dossiers: OptionDossier[]; parentParDefaut: string | null; dossier?: DossierEditable; interdits?: string[]; onClose: () => void };

function ChoixImage({ titre, actuelle, fichier, onChoisir, onRetirer, carre = false }: { titre: string; actuelle: string | null; fichier: File | null; onChoisir: (f: File | null) => void; onRetirer?: () => void; carre?: boolean }) {
  const apercu = fichier ? URL.createObjectURL(fichier) : actuelle;
  const id = `img-${titre.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div className={styles.image}>
      <strong className="text-[13px] text-graphite">{titre}</strong>
      {apercu ? <img src={apercu} alt="" style={carre ? { aspectRatio: "1 / 1", width: 96, borderRadius: "50%" } : undefined} /> : <span className={styles.imageVide}>Aucune image</span>}
      <div>
        <label htmlFor={id} className={styles.outil}>
          <ImageIcon width={15} height={15} />
          {fichier ? "Changer" : "Choisir"}
        </label>
        <input id={id} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => onChoisir(e.target.files?.[0] ?? null)} />
        {actuelle && onRetirer && !fichier ? (
          <button type="button" className={`${styles.outil} ${styles.outilDanger}`} onClick={onRetirer}>
            <TrashIcon width={15} height={15} />
            Retirer
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function ModalDossier({ dossiers, parentParDefaut, dossier, interdits = [], onClose }: Props) {
  const router = useRouter();
  const [nom, setNom] = useState(dossier?.nom ?? "");
  const [parentId, setParentId] = useState(dossier ? (dossier.parentId ?? "") : (parentParDefaut ?? ""));
  const [auteurNom, setAuteurNom] = useState(dossier?.auteurNom ?? "");
  const [auteurRole, setAuteurRole] = useState(dossier?.auteurRole ?? "");
  const [auteurBio, setAuteurBio] = useState(dossier?.auteurBio ?? "");
  const [couverture, setCouverture] = useState<File | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [retraits, setRetraits] = useState<{ couverture: boolean; auteur: boolean }>({ couverture: false, auteur: false });
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const exclus = new Set([...(dossier ? [dossier.id] : []), ...interdits]);

  async function images(id: string) {
    for (const [type, f] of [["couverture", couverture], ["auteur", photo]] as const) {
      if (f) {
        const r = await televerser(`/api/admin/dossiers/${id}/image/${type}`, "PUT", f, {});
        if (r.statut >= 300) toast(r.corps.message ?? "Image non enregistrée.");
      } else if (retraits[type]) {
        await fetch(`/api/admin/dossiers/${id}/image/${type}`, { method: "DELETE" });
      }
    }
  }

  async function valider(e: FormEvent) {
    e.preventDefault();
    if (enCours) return;
    setEnCours(true);
    setErreur(null);
    try {
      const donnees = { nom, parentId: parentId || null, auteurNom, auteurRole, auteurBio };
      const r = dossier ? await modifierDossier(dossier.id, donnees) : await creerDossier(donnees);
      if (!r.ok || !r.id) return setErreur(r.ok ? "Enregistrement impossible." : r.message);
      await images(r.id);
      toast(dossier ? "Dossier enregistré." : "Dossier créé.");
      if (dossier) router.refresh();
      else router.push(`/admin/ressources?dossier=${r.id}`);
      onClose();
    } finally {
      setEnCours(false);
    }
  }

  return (
    <Modal onClose={enCours ? () => undefined : onClose} label={dossier ? "Modifier le dossier" : "Nouveau dossier"} size="large">
      <form onSubmit={valider} className={styles.formulaire}>
        <h3 className="font-display text-[19px] text-graphite">{dossier ? "Modifier le dossier" : "Nouveau dossier"}</h3>
        <Champ label="Nom du dossier" htmlFor="ds-nom">
          <input id="ds-nom" className={ui.saisie} required maxLength={120} value={nom} onChange={(e) => setNom(e.target.value)} />
        </Champ>
        <Champ label={dossier ? "Emplacement" : "Créer dans"} htmlFor="ds-parent" hint="5 niveaux de dossiers au maximum.">
          <select id="ds-parent" className={ui.saisie} value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">Bibliothèque (racine)</option>
            {dossiers
              .filter((d) => !exclus.has(d.id))
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {`${"— ".repeat(d.profondeur - 1)}${d.libelle}`}
                </option>
              ))}
          </select>
        </Champ>
        <div className={styles.images}>
          <ChoixImage
            titre="Couverture"
            actuelle={dossier?.couverture && !retraits.couverture ? imageDossier(dossier.id, "couverture") : null}
            fichier={couverture}
            onChoisir={setCouverture}
            onRetirer={() => setRetraits((r) => ({ ...r, couverture: true }))}
          />
          <ChoixImage
            titre="Photo de l’auteur"
            actuelle={dossier?.auteurPhoto && !retraits.auteur ? imageDossier(dossier.id, "auteur") : null}
            fichier={photo}
            onChoisir={setPhoto}
            onRetirer={() => setRetraits((r) => ({ ...r, auteur: true }))}
            carre
          />
        </div>
        <div className={styles.deux}>
          <Champ label="Auteur (facultatif)" htmlFor="ds-auteur">
            <input id="ds-auteur" className={ui.saisie} maxLength={120} value={auteurNom} onChange={(e) => setAuteurNom(e.target.value)} placeholder="Nom et prénom" />
          </Champ>
          <Champ label="Rôle de l’auteur" htmlFor="ds-role">
            <input id="ds-role" className={ui.saisie} maxLength={160} value={auteurRole} onChange={(e) => setAuteurRole(e.target.value)} placeholder="Fonction, organisation" />
          </Champ>
        </div>
        <Champ label="Présentation de l’auteur" htmlFor="ds-bio">
          <textarea id="ds-bio" className={`${ui.saisie} min-h-[72px] resize-y`} maxLength={600} value={auteurBio} onChange={(e) => setAuteurBio(e.target.value)} />
        </Champ>
        {erreur ? <p className={styles.erreur}>{erreur}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Btn variant="primary" type="submit" disabled={enCours}>
            {enCours ? <SpinnerIcon width={16} height={16} className="animate-spin" /> : null}
            {dossier ? "Enregistrer" : "Créer le dossier"}
          </Btn>
          <Btn type="button" onClick={onClose} disabled={enCours}>
            Annuler
          </Btn>
        </div>
      </form>
    </Modal>
  );
}
